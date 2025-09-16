import { Injectable } from '@nestjs/common';
import { Keypair, TransactionBuilder, Networks, Operation, Asset } from '@stellar/stellar-sdk';
import Server from '@stellar/stellar-sdk';

interface EnsureTrustlineParams {
  publicKey: string;
  secret: string;
  assetCode: string;
  assetIssuer: string;
  horizonUrl?: string;
}

@Injectable()
export class StellarUtilityService {
  private defaultHorizon = process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org';

  async ensureTrustline(params: EnsureTrustlineParams) {
    const { publicKey, secret, assetCode, assetIssuer } = params;
    const horizon = new Server(params.horizonUrl || this.defaultHorizon);
    const account = await horizon.loadAccount(publicKey);
    const existing = account.balances.find(b => b.asset_code === assetCode && b.asset_issuer === assetIssuer);
    if (existing) return { created: false };

    const asset = new Asset(assetCode, assetIssuer);
    const fee = await horizon.fetchBaseFee();
    const tx = new TransactionBuilder(account, { fee: fee.toString(), networkPassphrase: Networks.TESTNET })
      .addOperation(Operation.changeTrust({ asset }))
      .setTimeout(180)
      .build();

    tx.sign(Keypair.fromSecret(secret));
    const result = await horizon.submitTransaction(tx);
    return { created: true, result };
  }
}
