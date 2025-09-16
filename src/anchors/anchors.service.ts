import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AnchorsRepository } from './anchors.repository';
import { WalletsService } from './wallets.service';
import { AnchorTransactionsRepository } from './anchor-transactions.repository';
import { AnchorAuthService } from './anchor-auth.service';
import { StellarUtilityService } from './stellar-utility.service';
import { LedgerRepository } from '../ledger/ledger.repository';
import { UsersRepository } from '../users/users.repository';
import { Horizon } from '@stellar/stellar-sdk';

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
    
    // Fund the account on testnet using friendbot
    try {
      await this.http.get(`https://friendbot.stellar.org/?addr=${wallet.public_key}`);
    } catch (e) {
      // Friendbot might fail, but continue - account might already be funded
    }
    
    await this.stellarUtil.ensureTrustline({
      publicKey: wallet.public_key,
      secret,
      assetCode,
      assetIssuer,
    });
    // Placeholder: numa integração real chamaria endpoint do anchor para gerar interactive url
    const interactiveUrl = `https://anchor.example.com/deposit?account=${wallet.public_key}&amount=${amount}`;
    const anchorTx = await this.anchorTxRepo.create({
      user_id: userId,
      type: 'deposit',
      amount,
      status: 'PENDING',
      memo: wallet.public_key.slice(0, 10),
      extra: { authToken: token },
    });
    return { interactiveUrl, anchorTransaction: anchorTx, walletPublicKey: wallet.public_key };
  }

  async listTransactions(userId: string) {
    return this.anchorTxRepo.listByUser(userId);
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
    // Map anchor status -> internal
    const anchorStatus = txData.status;
    if (anchorStatus === 'completed') {
      // Finaliza depósito (id é anchorTxId em nosso modelo simplificado)
      try {
        const finalized = await this.finalizeDeposit(txData.id);
        return { ok: true, finalized };
      } catch (e) {
        return { ok: false, error: (e as Error).message };
      }
    } else if (anchorStatus === 'pending_trust' || anchorStatus === 'pending_user_transfer_start') {
      // Atualiza status intermediário se quisermos refletir
      try {
        await this.anchorTxRepo.updateStatus(txData.id, anchorStatus.toUpperCase());
      } catch {
        /* ignore */
      }
      return { ok: true, status: anchorStatus };
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
