import { Injectable } from '@nestjs/common';

@Injectable()
export class SorobanService {
  activatePolicy(user: string, product: string, amount: number) {
    console.log(
      `[Soroban] Registrando policy: user=${user}, product=${product}, amount=${amount}`,
    );
    return { txHash: 'mocked_tx_hash' };
  }

  payout(user: string, amount: number) {
    console.log(`[Soroban] Executando payout: user=${user}, amount=${amount}`);
    return { txHash: 'mocked_tx_hash_payout' };
  }
}
