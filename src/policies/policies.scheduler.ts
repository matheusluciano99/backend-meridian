import { Injectable, Logger } from '@nestjs/common';
import { PoliciesRepository } from './policies.repository';
import { SorobanService } from '../soroban/soroban.service';
import { xlmToStroops } from '../common/stellar-units';
import { LedgerRepository } from '../ledger/ledger.repository';
import { PremiumRefsRepository } from './premium-refs.repository';
import { UsersRepository } from '../users/users.repository';

@Injectable()
export class PoliciesBillingScheduler {
  private readonly logger = new Logger(PoliciesBillingScheduler.name);

  constructor(
    private readonly policiesRepo: PoliciesRepository,
    private readonly soroban: SorobanService,
    private readonly ledgerRepo: LedgerRepository,
    private readonly premiumRefs: PremiumRefsRepository,
    private readonly usersRepo: UsersRepository,
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
      // Primeiro tenta cobrança on-chain; só depois atualiza DB para evitar divergência
      let txHash: string | undefined;
      let nextCharge: string | undefined;
      let premiumSkipped = false;
      try {
        const user = await this.usersRepo.ensureWalletAddress(p.user_id);
        if (!user?.wallet_address) throw new Error('User wallet missing');
        const amountStroops = xlmToStroops(p.hourly_rate_xlm.toString());
        const effective = amountStroops <= 0n ? 1n : amountStroops;
        const chain = await this.soroban.collectPremiumWithRef(user.wallet_address, effective, ref);
        if (!chain || !chain.txHash) throw new Error('collectPremiumWithRef returned no tx');
        txHash = chain.txHash;
      } catch (e: any) {
        const msg = (e.message || '').toLowerCase();
        if (msg.includes('invalidaction') || msg.includes('invalid action') || msg.includes('unreachable') || msg.includes('wasmvm') || msg.includes('unknown') || msg.includes('symbol')) {
          premiumSkipped = true;
          this.logger.warn(`Soft-fail cobrança on-chain policy ${p.id} (skipped): ${e.message}`);
        } else {
          this.logger.warn(`Falha cobrança on-chain policy ${p.id}: ${e.message}`);
          continue; // aborta este ciclo, tenta na próxima
        }
      }

      const updates: Record<string, any> = { next_charge_at: new Date(now + 60 * 60 * 1000).toISOString() };
      if (!premiumSkipped) {
        updates.funding_balance_xlm = (p.funding_balance_xlm || 0) - p.hourly_rate_xlm;
        updates.total_premium_paid_xlm = (p.total_premium_paid_xlm || 0) + p.hourly_rate_xlm;
        updates.last_charge_at = new Date().toISOString();
      }
      nextCharge = updates.next_charge_at;
      try {
        await this.policiesRepo.updateFields(p.id, updates);
      } catch (e) {
        this.logger.error(`Falha atualizar DB pós cobrança policy ${p.id}: ${(e as Error).message}`);
        continue;
      }

      // Registrar refs e ledger
      try {
        await this.premiumRefs.save({ ref, policy_id: p.id, user_id: p.user_id, amount_xlm: p.hourly_rate_xlm, tx_hash: txHash, collected: !premiumSkipped });
      } catch {}
      try {
        await this.ledgerRepo.add({
          user_id: p.user_id,
          policy_id: p.id,
          event_type: premiumSkipped ? 'policy_hourly_charge_skipped' : 'policy_hourly_charge',
          event_data: { cycle_end: nextCharge, ref, tx_hash: txHash },
          amount: premiumSkipped ? 0 : p.hourly_rate_xlm,
          currency: 'XLM'
        });
      } catch {}
      processed++;
    }
    if (processed) this.logger.log(`Cobranças horárias processadas: ${processed}`);
  }
}
