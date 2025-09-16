import { Injectable } from '@nestjs/common';
import { Keypair, TransactionBuilder, Networks, Operation, Asset, Horizon } from '@stellar/stellar-sdk';
import axios from 'axios';

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
    const horizon = new Horizon.Server(params.horizonUrl || this.defaultHorizon);
    
    // XLM (native asset) doesn't need trustline
    if (assetCode === 'XLM' || !assetIssuer) {
      return { created: false, message: 'Native asset, no trustline needed' };
    }
    
    let account;
    try {
      account = await horizon.loadAccount(publicKey);
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Account not found, try to fund it
        try {
          await axios.get(`https://friendbot.stellar.org/?addr=${publicKey}`);
          // Wait a bit for funding to propagate
          await new Promise(resolve => setTimeout(resolve, 2000));
          account = await horizon.loadAccount(publicKey);
        } catch (fundError) {
          throw new Error(`Account ${publicKey} not found and funding failed: ${fundError.message}`);
        }
      } else {
        throw error;
      }
    }
    
    const existing = account.balances.find(b => (b as any).asset_code === assetCode && (b as any).asset_issuer === assetIssuer);
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
