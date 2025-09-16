import { Injectable, Logger } from '@nestjs/common';
import { PoliciesRepository } from './policies.repository';
import { SorobanService } from '../soroban/soroban.service';
import { xlmToStroops } from '../common/stellar-units';
import { LedgerRepository } from '../ledger/ledger.repository';
import { PremiumRefsRepository } from './premium-refs.repository';

@Injectable()
export class PoliciesBillingScheduler {
  private readonly logger = new Logger(PoliciesBillingScheduler.name);

  constructor(
    private readonly policiesRepo: PoliciesRepository,
    private readonly soroban: SorobanService,
  private readonly ledgerRepo: LedgerRepository,
  private readonly premiumRefs: PremiumRefsRepository,
  ) {
    // Executa a cada 5 minutos
    setInterval(() => {
      this.chargeDuePolicies().catch(err => this.logger.error('Scheduler error', err.stack));
    }, 5 * 60 * 1000);
  }

  async chargeDuePolicies() {
    // TODO: otimizar com filtro server-side (quando policies.next_charge_at index for usado com RPC custom)
    const all = await this.policiesRepo.findAll();
    const now = Date.now();
    let processed = 0;
    for (const p of all as any[]) {
      if (p.status !== 'ACTIVE') continue;
      if (!p.next_charge_at || new Date(p.next_charge_at).getTime() > now) continue;
      if (!p.hourly_rate_xlm) continue;
      if ((p.funding_balance_xlm || 0) < p.hourly_rate_xlm) {
        // Pausar por insuficiência de funding
        await this.policiesRepo.updateFields(p.id, { status: 'PAUSED' });
        continue;
      }
  const ref = `hour:${p.id}:${new Date().toISOString().slice(0,13)}`; // hora base
  if (await this.premiumRefs.exists(ref)) continue;
  const newFunding = (p.funding_balance_xlm || 0) - p.hourly_rate_xlm;
      const totalPaid = (p.total_premium_paid_xlm || 0) + p.hourly_rate_xlm;
      const nextCharge = new Date(now + 60 * 60 * 1000).toISOString();
      await this.policiesRepo.updateFields(p.id, {
        funding_balance_xlm: newFunding,
        total_premium_paid_xlm: totalPaid,
        last_charge_at: new Date().toISOString(),
        next_charge_at: nextCharge,
      });
      // chain + ledger + idempotência off-chain
      let txHash: string | undefined;
      try {
        const amountStroops = xlmToStroops(p.hourly_rate_xlm.toString());
        const chain = await this.soroban.collectPremiumWithRef(p.user_id, amountStroops, ref);
        txHash = chain.txHash;
        await this.premiumRefs.save({ ref, policy_id: p.id, user_id: p.user_id, amount_xlm: p.hourly_rate_xlm, tx_hash: txHash, collected: true });
        await this.ledgerRepo.add({
          user_id: p.user_id,
          policy_id: p.id,
          event_type: 'policy_hourly_charge',
          event_data: { cycle_end: nextCharge, ref, tx_hash: txHash },
          amount: p.hourly_rate_xlm,
          currency: 'XLM'
        });
      } catch (e) {
        this.logger.warn(`Falha cobrança policy ${p.id}: ${(e as Error).message}`);
        continue;
      }
      processed++;
    }
    if (processed) this.logger.log(`Cobranças horárias processadas: ${processed}`);
  }
}
