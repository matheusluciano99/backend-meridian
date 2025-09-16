import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { rpc, Keypair, Contract, TransactionBuilder, Address, xdr } from '@stellar/stellar-sdk';
import { STROOPS_PER_XLM, stroopsToXlmString } from '../common/stellar-units';

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

  // Placeholder até o contrato suportar payment_ref on-chain
  async collectPremiumWithRef(userAddress: string, amountStroops: bigint, paymentRef: string) {
    if (!this.riskPoolContract) throw new Error('RiskPool contract ID not configured');
    const account = await this.loadAccount();
    // Tenta método novo; se falhar por inexistente, fallback para antigo
    let useLegacy = false;
    try {
      const txNew = new TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          this.riskPoolContract.call(
            'collect_premium_with_ref',
            Address.fromString(userAddress).toScVal(),
            this.buildI128(amountStroops),
            xdr.ScVal.scvString(paymentRef),
          ),
        )
        .setTimeout(30)
        .build();
      const hash = await this.signAndSend(txNew);
      return { txHash: hash, paymentRef };
    } catch (e: any) {
      const msg = (e?.message || '').toLowerCase();
      if (msg.includes('unknown') || msg.includes('symbol') || msg.includes('missing')) {
        useLegacy = true;
      } else {
        throw e;
      }
    }
    if (useLegacy) {
      const legacy = await this.collectPremium(userAddress, amountStroops);
      return { ...legacy, paymentRef, legacy: true };
    }
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
    return { balanceStroops: stroops, balanceXlm: stroopsToXlmString(stroops) } as any;
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
    const raw = (sim as any).returnValue;
    // Decoding Policy struct: expect scvMap with fields id (u64), user (address), product (string), amount (i128), active (bool)
    let decoded: any = { raw };
    try {
      const scv = xdr.ScVal.fromXDR(raw.toXDR ? raw.toXDR() : raw);
      if (scv.switch() === xdr.ScValType.scvMap()) {
        const map = scv.map();
        const get = (k: string) => map?.find(m => {
          const key = m.key();
          return key.switch() === xdr.ScValType.scvSymbol() && key.sym().toString() === k;
        });
        const idEntry = get('id');
        const userEntry = get('user');
        const productEntry = get('product');
        const amountEntry = get('amount');
        const activeEntry = get('active');
        const toBigIntI128 = (val: any) => {
          if (!val) return 0n;
            if (val.switch() === xdr.ScValType.scvI128()) {
              const parts = val.i128();
              const hi = BigInt(parts.hi().toString());
              const lo = BigInt(parts.lo().toString());
              return (hi << 64n) + lo;
            }
            return 0n;
        };
        const idVal = idEntry?.val();
        const amountVal = amountEntry?.val();
        const activeVal = activeEntry?.val();
        decoded = {
          id: idVal ? Number(idVal.u64().toString()) : undefined,
          user: userEntry?.val()?.address()?.accountId()?.ed25519()?.toString('hex'),
          product: productEntry?.val()?.str()?.toString(),
          amountStroops: toBigIntI128(amountVal),
          amountXlm: stroopsToXlmString(toBigIntI128(amountVal)),
          active: activeVal ? activeVal.b() : undefined,
          raw,
        };
      }
    } catch (_) {}
    return decoded;
  }
}
