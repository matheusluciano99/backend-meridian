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
    
    // Mesmo para XLM precisamos garantir que a conta existe e está financiada.
    // Para ativos não nativos, além disso criamos trustline.
    const ensureAccountExists = async () => {
      try {
        return await horizon.loadAccount(publicKey);
      } catch (error: any) {
        if (error.response?.status === 404) {
          await axios.get(`https://friendbot.stellar.org/?addr=${publicKey}`);
          // Poll até aparecer (máx ~5s)
          for (let i = 0; i < 5; i++) {
            await new Promise(r => setTimeout(r, 1000));
            try {
              return await horizon.loadAccount(publicKey);
            } catch (_) {}
          }
          throw new Error(`Account ${publicKey} funding did not propagate in time`);
        }
        throw error;
      }
    };

    let account = await ensureAccountExists();

    // XLM não requer trustline adicional
    if (assetCode === 'XLM' || !assetIssuer) {
      return { created: false, message: 'Account exists (native asset)' };
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
