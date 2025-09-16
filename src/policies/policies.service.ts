import { Injectable, NotFoundException } from '@nestjs/common';
import { PoliciesRepository } from './policies.repository';
import { SorobanService } from '../soroban/soroban.service';
import { xlmToStroops } from '../common/stellar-units';
import { ProductsRepository } from '../products/products.repository';
import { LedgerRepository } from '../ledger/ledger.repository';
import { PremiumRefsRepository } from './premium-refs.repository';
import { UsersRepository } from '../users/users.repository';

@Injectable()
export class PoliciesService {
  constructor(
    private readonly repo: PoliciesRepository,
    private readonly sorobanService: SorobanService,
    private readonly productsRepo: ProductsRepository,
    private readonly ledgerRepo: LedgerRepository,
    private readonly premiumRefsRepo: PremiumRefsRepository,
    private readonly usersRepo: UsersRepository,
  ) {}

  async create(userId: string, productId: string) {
    // Validate user exists to avoid FK violation
    const user = await this.usersRepo.findById(userId);
    if (!user) {
      throw new NotFoundException({
        message: 'User not found',
        userId,
        hint: 'Crie o usuário primeiro ou use um userId válido.'
      });
    }
    const product = await this.productsRepo.findById(productId);
    if (!product) {
      throw new NotFoundException({
        message: 'Product not found',
        productId,
        hint: 'Verifique se o produto existe ou re-seed o banco.'
      });
    }

    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + (product.coverage_duration || 30));

    // hourly_rate_xlm: derivar do preço do produto (assumindo price já em XLM)
    const hourlyRate = (product.price || 0) / 24; // simplificação inicial
    const coverageAmount = product.coverage_amount;

    const policy = {
      user_id: userId,
      product_id: productId,
      status: 'PENDING_FUNDING',
      premium_amount: product.price, // manter compatibilidade legado
      coverage_amount: coverageAmount,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      auto_renewal: false,
      billing_model: 'HOURLY',
      hourly_rate_xlm: hourlyRate,
      funding_balance_xlm: 0,
      total_premium_paid_xlm: 0,
      coverage_limit_xlm: coverageAmount,
      next_charge_at: null,
      last_charge_at: null
    } as any;

    return this.repo.create(policy);
  }

  async activate(id: string) {
    const policy = await this.repo.findById(id);
    if (!policy) throw new Error('Policy not found');
    if (policy.status !== 'PENDING_FUNDING' && policy.status !== 'PAUSED') {
      throw new Error(`Cannot activate policy in status ${policy.status}`);
    }
    if (!policy.hourly_rate_xlm) throw new Error('Policy missing hourly_rate_xlm');
    if ((policy.funding_balance_xlm || 0) < policy.hourly_rate_xlm) {
      throw new Error('Insufficient funding to activate (need at least one hour funded)');
    }

    const user = await this.usersRepo.ensureWalletAddress(policy.user_id);
    if (!user) throw new Error('User not found');
    const userWalletAddress = user.wallet_address;

    const activationRef = `activate:${id}`;
    let chainTx: string | undefined;
    let premiumSkipped = false;
    try {
      const amountStroops = xlmToStroops(policy.hourly_rate_xlm.toString());
      const effectiveAmount = amountStroops <= 0n ? 1n : amountStroops;
      console.log('[PoliciesService.activate] hourly_rate_xlm=', policy.hourly_rate_xlm, 'stroops=', amountStroops.toString(), 'effective=', effectiveAmount.toString());
      const chain = await this.sorobanService.collectPremiumWithRef(userWalletAddress, effectiveAmount, activationRef);
      if (!chain || !chain.txHash) throw new Error('collectPremiumWithRef activation returned no tx');
      chainTx = chain.txHash;
    } catch (e) {
      const msg = (e as Error).message || '';
      const lower = msg.toLowerCase();
      if (
        lower.includes('invalidaction') ||
        lower.includes('invalid action') ||
        lower.includes('unreachable') ||
        lower.includes('wasmvm') ||
        lower.includes('unknown') ||
        lower.includes('symbol')
      ) {
        premiumSkipped = true;
        console.warn('[PoliciesService.activate] premium collection skipped (soft-fail):', msg);
      } else {
        console.error('[PoliciesService.activate] premium collection failed hard:', msg);
        throw new Error('On-chain activation premium failed: ' + msg);
      }
    }

    const now = new Date();
    const nextHour = new Date(now.getTime() + 60 * 60 * 1000);
    const fields: Record<string, any> = { status: 'ACTIVE', next_charge_at: nextHour.toISOString() };
    if (!premiumSkipped) {
      fields.funding_balance_xlm = (policy.funding_balance_xlm || 0) - policy.hourly_rate_xlm;
      fields.total_premium_paid_xlm = (policy.total_premium_paid_xlm || 0) + policy.hourly_rate_xlm;
      fields.last_charge_at = now.toISOString();
    }
    const updatedPartial = await this.repo.updateFields(id, fields);
    const updated = await this.repo.findById(id); // recarrega com relação product

    try {
      if (!premiumSkipped) {
        await this.ledgerRepo.add({
          user_id: updated.user_id,
          policy_id: updated.id,
          event_type: 'policy_hourly_charge',
          event_data: { reason: 'activation_first_hour', ref: activationRef, tx_hash: chainTx },
          amount: policy.hourly_rate_xlm,
          currency: 'XLM'
        });
      } else {
        await this.ledgerRepo.add({
          user_id: updated.user_id,
          policy_id: updated.id,
          event_type: 'policy_hourly_charge_skipped',
          event_data: { reason: 'activation_soft_fail', ref: activationRef },
          amount: 0,
          currency: 'XLM'
        });
      }
      await this.ledgerRepo.add({
        user_id: updated.user_id,
        policy_id: updated.id,
        event_type: 'policy_activated',
        event_data: { activation_ref: activationRef, tx_hash: chainTx }
      });
      try {
        await this.premiumRefsRepo.save({ ref: activationRef, policy_id: updated.id, user_id: updated.user_id, amount_xlm: policy.hourly_rate_xlm, tx_hash: chainTx, collected: !premiumSkipped });
      } catch {}
    } catch {}

    let onchainActivationSkipped = false;
    try {
      const amountXlm = policy.coverage_amount || 0;
      const amountStroops = xlmToStroops((amountXlm || 0).toString());
      const coverageStroops = amountStroops <= 0n ? 1n : amountStroops;
      await this.sorobanService.activatePolicy(
        userWalletAddress,
        policy.product?.code || 'UNKNOWN',
        coverageStroops,
        activationRef
      );
    } catch (error: any) {
      const msg = (error?.message || '').toLowerCase();
      if (msg.includes('invalidaction') || msg.includes('invalid action') || msg.includes('unreachable') || msg.includes('wasmvm')) {
        onchainActivationSkipped = true;
        console.warn('[PoliciesService.activate] on-chain activate_policy skipped (soft-fail):', error.message);
      } else {
        console.error('Erro ao ativar apólice no contrato (hard fail):', error);
        await this.repo.updateFields(id, { status: policy.status, funding_balance_xlm: policy.funding_balance_xlm, total_premium_paid_xlm: policy.total_premium_paid_xlm, last_charge_at: policy.last_charge_at, next_charge_at: policy.next_charge_at });
        throw error;
      }
    }

    if (onchainActivationSkipped) {
      try {
        await this.ledgerRepo.add({
          user_id: updated.user_id,
          policy_id: updated.id,
          event_type: 'policy_activation_onchain_skipped',
          event_data: { reason: 'contract_invalidaction', ref: activationRef },
          amount: 0,
          currency: 'XLM'
        });
      } catch {}
    }
    return updated;
  }

  pause(id: string) {
    return this.pausePolicy(id);
  }

  private async pausePolicy(id: string) {
    const policy = await this.repo.findById(id);
    if (!policy) throw new Error('Policy not found');
    if (policy.status !== 'ACTIVE') throw new Error('Only ACTIVE policies can be paused');
    // Tenta pausar on-chain (best effort)
    let txHash: string | undefined;
    try {
      const chain = await this.sorobanService.pausePolicy(Number(id));
      txHash = chain.txHash;
    } catch (e) {
      // se falhar continuamos apenas local (pode mostrar warning depois)
    }
    const updated = await this.repo.updateStatus(id, 'PAUSED');
    try {
      await this.ledgerRepo.add({
        user_id: updated.user_id,
        policy_id: updated.id,
        event_type: 'policy_paused',
        event_data: { tx_hash: txHash }
      });
    } catch {}
    return updated;
  }

  findAll() {
    return this.repo.findAll();
  }

  findAllByUser(userId: string) {
    return this.repo.findAllByUser(userId);
  }

  getById(id: string) {
    return this.repo.findById(id);
  }

  async fundPolicy(id: string, amount: number) {
    if (amount <= 0) throw new Error('Amount must be positive');
    const policy = await this.repo.findById(id);
    if (!policy) throw new Error('Policy not found');
    const updated = await this.repo.increaseFunding(id, amount);
    try {
      await this.ledgerRepo.add({
        user_id: updated.user_id,
        policy_id: updated.id,
        event_type: 'policy_funded',
        event_data: { amount },
        amount,
        currency: 'XLM'
      });
    } catch {}
    return updated;
  }

  async getCharges(id: string) {
    const policy = await this.repo.findById(id);
    if (!policy) throw new Error('Policy not found');
    // Buscar ledger events de cobrança
    // Simples: filtrar client-side pois repo ledger ainda não tem filtro por policy + type
    // (pode otimizar depois com endpoint específico ou RPC supabase filter)
  const charges = await this.ledgerRepo.findByPolicyAndType(id, 'policy_hourly_charge');
    // premium_refs para mapear ref -> tx_hash
    // Import inline dynamic to evitar dependência circular (ou mover repo premium_refs para fora)
  const refs = await this.premiumRefsRepo.listByPolicy(id);
  const refsMap = new Map(refs.map((r: any) => [r.ref, r]));
    const enriched = charges.map(c => {
      const ref = c.event_data?.ref || c.event_data?.activation_ref;
      const pref = ref ? refsMap.get(ref) : undefined;
      return {
        type: 'hourly_charge',
        ref,
        tx_hash: pref?.tx_hash,
        amount_xlm: c.amount,
        cycle_end: c.event_data?.cycle_end,
        created_at: c.created_at,
        source: c.event_data?.reason === 'activation_first_hour' ? 'activation' : 'scheduler'
      };
    });
    // Ordenar decrescente por created_at
    enriched.sort((a,b) => (a.created_at > b.created_at ? -1 : 1));
    return {
      policy_id: id,
      total: enriched.length,
      charges: enriched
    };
  }
}
