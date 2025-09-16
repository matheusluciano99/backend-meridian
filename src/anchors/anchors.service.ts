import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AnchorsRepository } from './anchors.repository';
import { WalletsService } from './wallets.service';
import { AnchorTransactionsRepository } from './anchor-transactions.repository';
import { AnchorAuthService } from './anchor-auth.service';
import { StellarUtilityService } from './stellar-utility.service';

@Injectable()
export class AnchorsService {
  constructor(
    private readonly repo: AnchorsRepository,
    private readonly http: HttpService,
    private readonly wallets: WalletsService,
    private readonly anchorTxRepo: AnchorTransactionsRepository,
    private readonly anchorAuth: AnchorAuthService,
    private readonly stellarUtil: StellarUtilityService,
  ) {}

  async startDeposit(userId: string, amount: number) {
    const wallet = await this.wallets.getOrCreate(userId);
    const token = await this.anchorAuth.getAuthToken(wallet.public_key);
    const secret = await this.wallets.getDecryptedSecret(userId);
    const assetCode = process.env.DEPOSIT_ASSET_CODE || 'USDC';
    const assetIssuer = process.env.DEPOSIT_ASSET_ISSUER || 'GTESTISSUERXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX';
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

  async handleWebhook(data: { transaction?: { status: string; id: string } }) {
    if (data.transaction?.status === 'completed') {
      return this.repo.updateStatus(data.transaction.id, 'SUCCEEDED');
    }
  }
}
