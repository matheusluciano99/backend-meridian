import { Controller, Get, Param, ParseIntPipe, Post, Body } from '@nestjs/common';
import { SorobanService } from './soroban.service';
import { LedgerRepository } from '../ledger/ledger.repository';
import { xlmToStroops } from '../common/stellar-units';

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
}