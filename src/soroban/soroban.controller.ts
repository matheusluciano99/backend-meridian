import { Controller, Get, Param, ParseIntPipe, Post, Body } from '@nestjs/common';
import { SorobanService } from './soroban.service';
import { LedgerRepository } from '../ledger/ledger.repository';
import { xlmToStroops, stroopsToXlmString } from '../common/stellar-units';

@Controller('soroban')
export class SorobanController {
  constructor(
    private readonly sorobanService: SorobanService,
    private readonly ledgerRepo: LedgerRepository,
  ) {}

  @Get('pool-balance')
  async getPoolBalance() {
    return this.sorobanService.getPoolBalance();
  }

  @Get('policy/:id')
  async getPolicy(@Param('id', ParseIntPipe) id: number) {
    return this.sorobanService.getPolicy(id);
  }

  @Post('payout')
  async payout(@Body() body: { to: string; amount_xlm: number; policy_id?: string }) {
    const { to, amount_xlm, policy_id } = body;
    if (!to || !amount_xlm || amount_xlm <= 0) throw new Error('Invalid payout payload');
    const amountStroops = xlmToStroops(amount_xlm.toString());
    const res = await this.sorobanService.payout(to, amountStroops);
    // Registrar ledger evento (não bloqueante em caso de erro)
    try {
      await this.ledgerRepo.add({
        user_id: to,
        policy_id: policy_id || null,
        event_type: 'pool_payout',
        event_data: { tx_hash: res.txHash },
        amount: amount_xlm,
        currency: 'XLM'
      });
    } catch {}
    return { txHash: res.txHash };
  }

  @Get('pool-metrics')
  async getPoolMetrics() {
    const balance = await this.sorobanService.getPoolBalance();

    // Buscar histórico de transações do ledger relacionadas ao pool
    const allLedger = await this.ledgerRepo.findAll();
    const poolTransactions = allLedger.filter(event =>
      event.event_type === 'policy_hourly_charge' ||
      event.event_type === 'policy_activated' ||
      event.event_type === 'pool_payout'
    );

    // Calcular estatísticas
    const collections = poolTransactions.filter(t => t.event_type !== 'pool_payout');
    const payouts = poolTransactions.filter(t => t.event_type === 'pool_payout');

    const totalCollected = collections.reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalPaidOut = payouts.reduce((sum, t) => sum + (t.amount || 0), 0);

    return {
      current_balance: {
        stroops: balance.balanceStroops?.toString(),
        xlm: stroopsToXlmString(balance.balanceStroops || 0n)
      },
      statistics: {
        total_collected_xlm: totalCollected,
        total_paid_out_xlm: totalPaidOut,
        net_balance_xlm: totalCollected - totalPaidOut,
        transaction_count: poolTransactions.length,
        collection_count: collections.length,
        payout_count: payouts.length
      },
      recent_transactions: poolTransactions.slice(0, 10).map(t => ({
        type: t.event_type,
        amount_xlm: t.amount,
        policy_id: t.policy_id,
        user_id: t.user_id,
        created_at: t.created_at,
        tx_hash: t.event_data?.tx_hash
      }))
    };
  }
}