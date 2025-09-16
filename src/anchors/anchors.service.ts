import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AnchorsRepository } from './anchors.repository';
import { WalletsService } from './wallets.service';
import { AnchorTransactionsRepository } from './anchor-transactions.repository';
import { AnchorAuthService } from './anchor-auth.service';

@Injectable()
export class AnchorsService {
  constructor(
    private readonly repo: AnchorsRepository,
    private readonly http: HttpService,
    private readonly wallets: WalletsService,
    private readonly anchorTxRepo: AnchorTransactionsRepository,
    private readonly anchorAuth: AnchorAuthService,
  ) {}

  async startDeposit(userId: string, amount: number) {
    const wallet = await this.wallets.getOrCreate(userId);
    const token = await this.anchorAuth.getAuthToken(wallet.public_key);
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

  async handleWebhook(data: { transaction?: { status: string; id: string } }) {
    if (data.transaction?.status === 'completed') {
      return this.repo.updateStatus(data.transaction.id, 'SUCCEEDED');
    }
  }
}
