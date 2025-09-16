import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AnchorsRepository } from './anchors.repository';
import { WalletsService } from './wallets.service';
import { AnchorTransactionsRepository } from './anchor-transactions.repository';
import { AnchorAuthService } from './anchor-auth.service';
import { StellarUtilityService } from './stellar-utility.service';
import { LedgerRepository } from '../ledger/ledger.repository';
import { UsersRepository } from '../users/users.repository';
import { Horizon, TransactionBuilder, Networks, Keypair } from '@stellar/stellar-sdk';

@Injectable()
export class AnchorsService {
  constructor(
    private readonly repo: AnchorsRepository,
    private readonly http: HttpService,
    private readonly wallets: WalletsService,
    private readonly anchorTxRepo: AnchorTransactionsRepository,
    private readonly anchorAuth: AnchorAuthService,
    private readonly stellarUtil: StellarUtilityService,
    private readonly ledgerRepo: LedgerRepository,
    private readonly usersRepo: UsersRepository,
  ) {}

  async startDeposit(userId: string, amount: number) {
    // Guarantee user exists (MVP fallback). Ideal: upstream auth ensures creation.
    try {
      const existingUser = await this.usersRepo.findById(userId);
      if (!existingUser) {
        await this.usersRepo.create({ id: userId, email: `${userId}@placeholder.local`, kyc_status: 'pending' });
      }
    } catch (e) {
      // If user creation fails, propagate error
      throw e;
    }
    const wallet = await this.wallets.getOrCreate(userId);
    const token = await this.anchorAuth.getAuthToken(wallet.public_key);
    const secret = await this.wallets.getDecryptedSecret(userId);
    const assetCode = process.env.DEPOSIT_ASSET_CODE || 'XLM';
    const assetIssuer = process.env.DEPOSIT_ASSET_ISSUER || '';
    
    // Garantir existência da conta somente se não existir
    const horizonUrl = process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org';
    const server = new Horizon.Server(horizonUrl);
    let accountExists = true;
    try {
      await server.loadAccount(wallet.public_key);
      console.log('[Account] Exists', wallet.public_key);
    } catch (e: any) {
      if (e.response?.status === 404) {
        accountExists = false;
        console.log('[Account] Not found, funding via Friendbot');
        await firstValueFrom(this.http.get(`https://friendbot.stellar.org/?addr=${wallet.public_key}`));
        // Poll até aparecer
        for (let i = 0; i < 5; i++) {
          await new Promise(r => setTimeout(r, 1000));
          try {
            await server.loadAccount(wallet.public_key);
            accountExists = true;
            console.log('[Account] Created', wallet.public_key);
            break;
          } catch {}
        }
        if (!accountExists) throw new Error('Account creation did not propagate');
      } else {
        throw e;
      }
    }
    
    await this.stellarUtil.ensureTrustline({
      publicKey: wallet.public_key,
      secret,
      assetCode,
      assetIssuer,
    });

    // Implementar fluxo completo SEP-24 com autenticação
    const anchorUrl = process.env.ANCHOR_URL || 'https://testanchor.stellar.org';

    try {
      // Primeiro: obter desafio SEP-10 via GET
      const challengeResponse = await this.http.get(`${anchorUrl}/auth`, {
        params: { account: wallet.public_key }
      }).toPromise();

      if (!challengeResponse?.data?.transaction) {
        throw new Error('Failed to get SEP-10 challenge');
      }

      // Assinar o desafio com a chave do cliente (usuário)
      const challengeXdr = challengeResponse.data.transaction;
      const transaction = TransactionBuilder.fromXDR(challengeXdr, Networks.TESTNET);

      // Assinar com a chave privada do usuário
      transaction.sign(Keypair.fromSecret(secret));

      const signedChallenge = transaction.toXDR();

      // Segundo: validar desafio e obter token via POST
      const tokenResponse = await this.http.post(`${anchorUrl}/auth`, {
        transaction: signedChallenge
      }).toPromise();

      const authToken = tokenResponse?.data?.token;
      if (!authToken) {
        throw new Error('Failed to get auth token');
      }

      // Terceiro: fazer depósito SEP-24
      // Para XLM nativo, usar "native" como asset_code conforme SEP-24
      const sep24AssetCode = assetCode === 'XLM' ? 'native' : assetCode;
      const depositPayload: any = {
        asset_code: sep24AssetCode,
        account: wallet.public_key,
        amount: amount.toString(),
      };
      
      // Adicionar memo para garantir roteamento correto na âncora (curto, só para referência)
      depositPayload.memo = wallet.public_key.slice(0, 10);
      depositPayload.memo_type = 'text';
      
      // Log auxiliar para debug
      console.log('[SEP24] Deposit payload', depositPayload);
      
      // Só incluir asset_issuer se não for nativo
      if (assetIssuer && assetCode !== 'XLM') {
        depositPayload.asset_issuer = assetIssuer;
      }

      const depositResponse = await this.http.post(`${anchorUrl}/sep24/transactions/deposit/interactive`, depositPayload, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }).toPromise();
      
      console.log('[SEP24] Interactive deposit response raw', depositResponse?.data);

      if (!depositResponse?.data?.url) {
        throw new Error('Failed to initiate SEP-24 deposit');
      }

      const interactiveUrl = depositResponse.data.url;
      const anchorTx = await this.anchorTxRepo.create({
        user_id: userId,
        type: 'deposit',
        amount,
        status: 'PENDING',
        memo: wallet.public_key.slice(0, 10),
        extra: { authToken, sep24Id: depositResponse.data.id },
      });

      return { interactiveUrl, anchorTransaction: anchorTx, walletPublicKey: wallet.public_key };

    } catch (error) {
      console.error('SEP-24 flow failed:', error);
      // Não usar fallback - deixar o erro aparecer para debug
      throw new Error(`SEP-24 integration failed: ${error.message}`);
    }
  }

  async listTransactions(userId: string) {
    return this.anchorTxRepo.listByUser(userId);
  }

  async getAccountInfo(userId: string) {
    const wallet = await this.wallets.getOrCreate(userId);
    const horizonUrl = process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org';
    const server = new Horizon.Server(horizonUrl);
    try {
      const acc = await server.loadAccount(wallet.public_key);
      return { publicKey: wallet.public_key, balances: acc.balances };
    } catch (e: any) {
      if (e.response?.status === 404) return { publicKey: wallet.public_key, exists: false };
      throw e;
    }
  }

  async refreshSep24(sep24Id: string) {
    // localizar transação interna pelo sep24Id armazenado em extra
    let internalTx;
    try {
      internalTx = await this.anchorTxRepo.findBySep24Id(sep24Id);
    } catch (e) {
      throw new Error(`Local SEP24 tx not found for id ${sep24Id}`);
    }
    if (!internalTx) throw new Error('Not found');
    // Se já completa, retorna
    if (internalTx.status === 'COMPLETED') return { updated: false, tx: internalTx };
    const anchorUrl = process.env.ANCHOR_URL || 'https://testanchor.stellar.org';
    const authToken = internalTx.extra?.authToken;
    if (!authToken) throw new Error('Missing auth token to query anchor');
    try {
      const resp = await this.http.get(`${anchorUrl}/sep24/transaction`, {
        params: { id: sep24Id },
        headers: { Authorization: `Bearer ${authToken}` }
      }).toPromise();
      const status = resp?.data?.transaction?.status;
      if (!status) return { updated: false, status: 'unknown' };
      if (status === 'completed') {
        const finalized = await this.finalizeDeposit(internalTx.id);
        return { updated: true, tx: finalized };
      }
      if (status !== internalTx.status) {
        await this.anchorTxRepo.updateStatus(internalTx.id, status.toUpperCase());
        const updated = await this.anchorTxRepo.findById(internalTx.id);
        return { updated: true, tx: updated };
      }
      return { updated: false, tx: internalTx, anchorStatus: status };
    } catch (e) {
      throw new Error(`Anchor query failed: ${(e as Error).message}`);
    }
  }

  async userBalance(userId: string) {
    const { data, error } = await (this.ledgerRepo as any).supabase
      .from('ledger')
      .select('amount, type, user_id');
    if (error) throw error;
    const balance = (data || [])
      .filter((r: any) => r.user_id === userId)
      .reduce((acc: number, r: any) => {
        if (r.type === 'deposit_credit') return acc + Number(r.amount);
        return acc;
      }, 0);
    return { userId, balance };
  }

  async finalizeDeposit(anchorTxId: string) {
    const tx = await this.anchorTxRepo.findById(anchorTxId);
    if (!tx) throw new Error('Anchor transaction not found');
    if (tx.status === 'COMPLETED') return tx; // idempotente

    // Atualiza status para COMPLETED primeiro
    await this.anchorTxRepo.updateStatus(tx.id, 'COMPLETED');

    // Credita ledger
    await this.ledgerRepo.add({
      user_id: tx.user_id,
      type: 'deposit_credit',
      source: 'anchor',
      amount: tx.amount,
      reference_id: tx.id,
    });

    // Atualiza saldo usuário (incremental)
    // Não há método dedicado: fazer update direto via supabase-js usando usersRepo? (usersRepo não tem update saldo) => usar supabase client inline
    // Simplicidade: inserir evento ledger é a verdade; se quiser saldo rápido criamos col update.
    // Se precisa refletir em users.balance, fazer operação separada aqui:
    // (Para manter coerência sem mexer no users.repository, fazemos client rápido)
    // TODO: refatorar para UsersRepository método updateBalance

    return this.anchorTxRepo.findById(tx.id);
  }

  async handleWebhook(data: { transaction?: { status: string; id: string } }) {
    const txData = data.transaction;
    if (!txData) return { ok: true };
    const sep24Id = txData.id;
    let internal;
    try {
      internal = await this.anchorTxRepo.findBySep24Id(sep24Id);
    } catch {
      return { ok: false, error: 'Internal transaction not found for sep24Id ' + sep24Id };
    }
    if (!internal) return { ok: false, error: 'No internal tx' };
    const anchorStatus = txData.status;
    const normalized = anchorStatus.toUpperCase();
    if (normalized === 'COMPLETED') {
      try {
        const finalized = await this.finalizeDeposit(internal.id);
        return { ok: true, finalized };
      } catch (e) {
        return { ok: false, error: (e as Error).message };
      }
    }
    const intermediateAllowed = ['PENDING_TRUST', 'PENDING_USER_TRANSFER_START', 'INCOMPLETE', 'PENDING_ANCHOR'];
    if (intermediateAllowed.includes(normalized) && internal.status !== normalized) {
      try {
        await this.anchorTxRepo.updateStatus(internal.id, normalized);
      } catch {}
      return { ok: true, status: normalized };
    }
    return { ok: true, ignored: anchorStatus };
  }

  async reconcileDeposits() {
    const horizonUrl = process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org';
  const server = new Horizon.Server(horizonUrl);
    const pending = await this.anchorTxRepo.listPendingDeposits();
    const results = [] as any[];
    for (const tx of pending) {
      try {
        // Strategy: look for any payment to user wallet with amount >= tx.amount & asset matches
        // NOTE: Simplified: we assume anchor sends payment directly; real impl may need memo matching.
        const wallet = await this.wallets.getOrCreate(tx.user_id);
        const payments = await server.payments().forAccount(wallet.public_key).limit(20).order('desc').call();
        const assetCode = process.env.DEPOSIT_ASSET_CODE || 'XLM';
        const assetIssuer = process.env.DEPOSIT_ASSET_ISSUER || '';
        const match = payments.records.find((p: any) => {
          if (assetCode === 'XLM') {
            return p.type === 'payment' && p.asset_type === 'native' && parseFloat(p.amount) >= parseFloat(tx.amount);
          } else {
            return p.type === 'payment' && p.asset_code === assetCode && p.asset_issuer === assetIssuer && parseFloat(p.amount) >= parseFloat(tx.amount);
          }
        });
        if (match) {
          const finalized = await this.finalizeDeposit(tx.id);
          results.push({ id: tx.id, finalized: true });
        } else {
          results.push({ id: tx.id, finalized: false });
        }
      } catch (e) {
        results.push({ id: tx.id, error: (e as Error).message });
      }
    }
    return { processed: results.length, results };
  }
}
