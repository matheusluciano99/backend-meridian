import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  rpc,
  Keypair,
  Contract,
  TransactionBuilder,
  Address,
  xdr,
} from '@stellar/stellar-sdk';

@Injectable()
export class SorobanService {
  private server: rpc.Server;
  private networkPassphrase: string;
  private policyRegistryContract: Contract;
  private riskPoolContract: Contract;
  private signerKeypair: Keypair;

  constructor(private configService: ConfigService) {
    this.networkPassphrase =
      this.configService.get<string>('STELLAR_NETWORK_PASSPHRASE') ||
      'Test SDF Network';
    this.server = new rpc.Server(
      this.configService.get<string>('STELLAR_RPC_URL') ||
        'https://soroban-testnet.stellar.org',
    );

    const policyRegistryId =
      this.configService.get<string>('POLICY_REGISTRY_CONTRACT_ID') || '';
    const riskPoolId =
      this.configService.get<string>('RISK_POOL_CONTRACT_ID') || '';
    const signerPrivateKey =
      this.configService.get<string>('SIGNER_PRIVATE_KEY') || '';

    this.policyRegistryContract = new Contract(policyRegistryId);
    this.riskPoolContract = new Contract(riskPoolId);
    this.signerKeypair = Keypair.fromSecret(signerPrivateKey);
  }

  async activatePolicy(user: string, product: string, amount: number) {
    try {
      // Get account
      const account = await this.server.getAccount(
        this.signerKeypair.publicKey(),
      );

      // Build transaction
      const tx = new TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          this.policyRegistryContract.call(
            'activate_policy',
            Address.fromString(user).toScVal(),
            xdr.ScVal.scvString(product),
            xdr.ScVal.scvI128(
              new xdr.Int128Parts({
                lo: xdr.Uint64.fromString(amount.toString()),
                hi: xdr.Uint64.fromString('0'),
              }),
            ),
            xdr.ScVal.scvString('payment_ref_placeholder'), // TODO: Add proper payment ref
          ),
        )
        .setTimeout(30)
        .build();

      // Prepare and simulate
      const preparedTx = await this.server.prepareTransaction(tx);

      // Sign
      preparedTx.sign(this.signerKeypair);

      // Submit
      const result = await this.server.sendTransaction(preparedTx);

      return { txHash: result.hash };
    } catch (error) {
      console.error('Error activating policy:', error);
      throw error;
    }
  }

  async payout(user: string, amount: number) {
    try {
      // Get account
      const account = await this.server.getAccount(
        this.signerKeypair.publicKey(),
      );

      // Build transaction
      const tx = new TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          this.riskPoolContract.call(
            'payout',
            Address.fromString(user).toScVal(),
            xdr.ScVal.scvI128(
              new xdr.Int128Parts({
                lo: xdr.Uint64.fromString(amount.toString()),
                hi: xdr.Uint64.fromString('0'),
              }),
            ),
          ),
        )
        .setTimeout(30)
        .build();

      // Prepare and simulate
      const preparedTx = await this.server.prepareTransaction(tx);

      // Sign
      preparedTx.sign(this.signerKeypair);

      // Submit
      const result = await this.server.sendTransaction(preparedTx);

      return { txHash: result.hash };
    } catch (error) {
      console.error('Error executing payout:', error);
      throw error;
    }
  }

  async getPoolBalance() {
    try {
      // Get account
      const account = await this.server.getAccount(
        this.signerKeypair.publicKey(),
      );

      // Build transaction to call get_balance
      const tx = new TransactionBuilder(account, {
        fee: '100',
        networkPassphrase: this.networkPassphrase,
      })
        .addOperation(
          this.riskPoolContract.call('get_balance'),
        )
        .setTimeout(30)
        .build();

      // Prepare transaction
      const preparedTx = await this.server.prepareTransaction(tx);

      // Simulate to get result (read-only call)
      const simulation = await this.server.simulateTransaction(preparedTx);

      // Log the full response for debugging
      console.log('Simulation result:', JSON.stringify(simulation, null, 2));

      return {
        balance: '0',
        message: 'Contract call simulated - check logs for details',
        contractId: this.riskPoolContract.contractId(),
        simulationResult: simulation
      };
    } catch (error) {
      console.error('Error getting pool balance:', error);
      return {
        balance: '0',
        error: error.message,
        contractId: this.riskPoolContract.contractId()
      };
    }
  }
}
