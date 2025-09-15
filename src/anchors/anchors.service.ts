import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AnchorsRepository } from './anchors.repository';

@Injectable()
export class AnchorsService {
  constructor(
    private readonly repo: AnchorsRepository,
    private readonly http: HttpService,
  ) {}

  async startDeposit(userWallet: string, amount: number) {
    const interactiveUrl = `https://testanchor.stellar.org/deposit?wallet=${userWallet}&amount=${amount}`;
    const payment = await this.repo.create({
      user_wallet: userWallet,
      amount,
      status: 'PENDING',
    });
    return { interactiveUrl, payment };
  }

  async handleWebhook(data: { transaction?: { status: string; id: string } }) {
    if (data.transaction?.status === 'completed') {
      return this.repo.updateStatus(data.transaction.id, 'SUCCEEDED');
    }
  }
}
