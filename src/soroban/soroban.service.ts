import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { rpc, Keypair, Contract, TransactionBuilder, Address, xdr } from '@stellar/stellar-sdk';
import { STROOPS_PER_XLM } from '../common/stellar-units';

@Injectable()
export class SorobanService {
  private server: rpc.Server;
  private networkPassphrase: string;
  private policyRegistryContract: Contract | null = null;
  private riskPoolContract: Contract | null = null;
  private signerKeypair: Keypair;

  constructor(private configService: ConfigService) {
    this.networkPassphrase =
      this.configService.get<string>('STELLAR_NETWORK_PASSPHRASE') ||
      'Test SDF Network ; September 2015';
    this.server = new rpc.Server(
        this.configService.get<string>('STELLAR_RPC_URL') ||
        'https://soroban-testnet.stellar.org',
    );

    const policyRegistryId =
      this.configService.get<string>('POLICY_REGISTRY_CONTRACT_ID') ||
      '';
    const riskPoolId =
      this.configService.get<string>('RISK_POOL_CONTRACT_ID') ||
      '';
    const signerPrivateKey = this.configService.get<string>('SIGNER_PRIVATE_KEY') || '';

    if (policyRegistryId) {
      this.policyRegistryContract = new Contract(policyRegistryId);
    }
    if (riskPoolId) {
      this.riskPoolContract = new Contract(riskPoolId);
    }
    if (signerPrivateKey) {
      this.signerKeypair = Keypair.fromSecret(signerPrivateKey);
    }
  }

  private ensureSigner() {
    if (!this.signerKeypair) throw new Error('Signer not configured');
  }

  private buildI128(amount: bigint): xdr.ScVal {
    const hi = (amount >> 64n) & 0xffffffffffffffffn;
    const lo = amount & 0xffffffffffffffffn;
    return xdr.ScVal.scvI128(
      new xdr.Int128Parts({
        hi: xdr.Uint64.fromString(hi.toString()),
        lo: xdr.Uint64.fromString(lo.toString()),
      }),
    );
  }

  private async loadAccount() {
    this.ensureSigner();
    return this.server.getAccount(this.signerKeypair.publicKey());
  }

  private async signAndSend(tx: any) {
    const prepared = await this.server.prepareTransaction(tx);
    prepared.sign(this.signerKeypair);
    const res = await this.server.sendTransaction(prepared);
    return res.hash;
  }

  async collectPremium(userAddress: string, amountStroops: bigint) {
    if (!this.riskPoolContract) throw new Error('RiskPool contract ID not configured');
    const account = await this.loadAccount();
    const tx = new TransactionBuilder(account, {
      fee: '100',
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(
        this.riskPoolContract.call(
          'collect_premium',
          Address.fromString(userAddress).toScVal(),
          this.buildI128(amountStroops),
        ),
      )
      .setTimeout(30)
      .build();
    const hash = await this.signAndSend(tx);
    return { txHash: hash };
  }

  async activatePolicy(userAddress: string, product: string, amountStroops: bigint, paymentRef: string) {
    if (!this.policyRegistryContract) throw new Error('PolicyRegistry contract ID not configured');
    const account = await this.loadAccount();
    const tx = new TransactionBuilder(account, {
      fee: '100',
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(
        this.policyRegistryContract.call(
          'activate_policy',
          Address.fromString(userAddress).toScVal(),
          xdr.ScVal.scvString(product),
          this.buildI128(amountStroops),
          xdr.ScVal.scvString(paymentRef),
        ),
      )
      .setTimeout(30)
      .build();
    const hash = await this.signAndSend(tx);
    return { txHash: hash };
  }

  async payout(toUserAddress: string, amountStroops: bigint) {
    if (!this.riskPoolContract) throw new Error('RiskPool contract ID not configured');
    const account = await this.loadAccount();
    const tx = new TransactionBuilder(account, {
      fee: '100',
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(
        this.riskPoolContract.call(
          'payout',
          Address.fromString(this.signerKeypair.publicKey()).toScVal(), // caller (admin)
          Address.fromString(toUserAddress).toScVal(),
          this.buildI128(amountStroops),
        ),
      )
      .setTimeout(30)
      .build();
    const hash = await this.signAndSend(tx);
    return { txHash: hash };
  }

  async getPoolBalance(): Promise<{ balanceStroops: bigint }> {
    if (!this.riskPoolContract) throw new Error('RiskPool contract ID not configured');
    const account = await this.loadAccount();
    const tx = new TransactionBuilder(account, {
      fee: '100',
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(this.riskPoolContract.call('get_balance'))
      .setTimeout(30)
      .build();
    const prepared = await this.server.prepareTransaction(tx);
  const sim = await this.server.simulateTransaction(prepared);
  const resultRet = (sim as any).returnValue; // SDK typing fallback
  // Fallback to 0 if not parseable
    let stroops = 0n;
    try {
      if (resultRet) {
        const scv = xdr.ScVal.fromXDR(resultRet.toXDR ? resultRet.toXDR() : resultRet);
        if (scv.switch() === xdr.ScValType.scvI128()) {
          const parts = scv.i128();
            const hi = BigInt(parts.hi().toString());
            const lo = BigInt(parts.lo().toString());
            stroops = (hi << 64n) + lo;
        }
      }
    } catch {}
    return { balanceStroops: stroops };
  }

  async getPolicy(policyId: number) {
    if (!this.policyRegistryContract) throw new Error('PolicyRegistry contract ID not configured');
    const account = await this.loadAccount();
    const tx = new TransactionBuilder(account, {
      fee: '100',
      networkPassphrase: this.networkPassphrase,
    })
      .addOperation(
        this.policyRegistryContract.call(
          'get_policy',
          xdr.ScVal.scvU64(xdr.Uint64.fromString(policyId.toString())),
        ),
      )
      .setTimeout(30)
      .build();
    const prepared = await this.server.prepareTransaction(tx);
    const sim = await this.server.simulateTransaction(prepared);
    return { raw: (sim as any).returnValue }; // MVP: retorno cru para debug
  }
}
