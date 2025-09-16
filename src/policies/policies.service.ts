import { Injectable } from '@nestjs/common';
import { PoliciesRepository } from './policies.repository';
import { SorobanService } from '../soroban/soroban.service';
import { xlmToStroops } from '../common/stellar-units';
import { ProductsRepository } from '../products/products.repository';
import { LedgerRepository } from '../ledger/ledger.repository';
import { PremiumRefsRepository } from './premium-refs.repository';

@Injectable()
export class PoliciesService {
  constructor(
    private readonly repo: PoliciesRepository,
    private readonly sorobanService: SorobanService,
    private readonly productsRepo: ProductsRepository,
    private readonly ledgerRepo: LedgerRepository,
    private readonly premiumRefsRepo: PremiumRefsRepository,
  ) {}

  async create(userId: string, productId: string) {
    const product = await this.productsRepo.findById(productId);
    if (!product) throw new Error(`Product with id ${productId} not found`);

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
    // Obter policy completa
    const policy = await this.repo.findById(id);
    if (!policy) throw new Error('Policy not found');
    if (policy.status !== 'PENDING_FUNDING' && policy.status !== 'PAUSED') {
      throw new Error(`Cannot activate policy in status ${policy.status}`);
    }
    if (!policy.hourly_rate_xlm) throw new Error('Policy missing hourly_rate_xlm');
    if ((policy.funding_balance_xlm || 0) < policy.hourly_rate_xlm) {
      throw new Error('Insufficient funding to activate (need at least one hour funded)');
    }

    // Debita primeira hora do funding e registra pagamento lógico
    const newFunding = (policy.funding_balance_xlm || 0) - policy.hourly_rate_xlm;
    const totalPaid = (policy.total_premium_paid_xlm || 0) + policy.hourly_rate_xlm;
    const now = new Date();
    const nextCharge = new Date(now.getTime() + 60 * 60 * 1000); // +1h

    // Atualiza status para ACTIVE antes da chamada on-chain
    const updated = await this.repo.updateFields(id, {
      status: 'ACTIVE',
      funding_balance_xlm: newFunding,
      total_premium_paid_xlm: totalPaid,
      last_charge_at: now.toISOString(),
      next_charge_at: nextCharge.toISOString()
    });

    // Ledger: primeira hora cobrada na ativação
    try {
      await this.ledgerRepo.add({
        user_id: updated.user_id,
        policy_id: updated.id,
        event_type: 'policy_hourly_charge',
        event_data: { reason: 'activation_first_hour' },
        amount: policy.hourly_rate_xlm,
        currency: 'XLM'
      });
      await this.ledgerRepo.add({
        user_id: updated.user_id,
        policy_id: updated.id,
        event_type: 'policy_activated',
        event_data: { activation_ref: `activate:${updated.id}` }
      });
    } catch (e) {
      // tolerância a falha ledger
    }

    try {
      const amountXlm = updated.coverage_amount || 0;
      const amountStroops = xlmToStroops((amountXlm || 0).toString());
      await this.sorobanService.activatePolicy(
        updated.user_id,
        updated.product?.code || 'UNKNOWN',
        amountStroops,
        `activate:${updated.id}`
      );
    } catch (error) {
      console.error('Erro ao ativar apólice no contrato:', error);
      // Reverte (melhoria futura: transação SQL + compensação)
      await this.repo.updateFields(id, { status: policy.status, funding_balance_xlm: policy.funding_balance_xlm, total_premium_paid_xlm: policy.total_premium_paid_xlm, last_charge_at: policy.last_charge_at, next_charge_at: policy.next_charge_at });
      throw error;
    }
    return updated;
  }

  pause(id: string) {
    return this.repo.updateStatus(id, 'PAUSED');
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
