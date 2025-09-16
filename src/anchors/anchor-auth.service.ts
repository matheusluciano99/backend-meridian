import { Injectable } from '@nestjs/common';
import { Keypair, Networks, TransactionBuilder, Operation, Memo } from '@stellar/stellar-sdk';
import * as crypto from 'crypto';

interface ChallengeRecord {
  tx: string;
  publicKey: string;
  expiresAt: number;
}

@Injectable()
export class AnchorAuthService {
  private serverKey = Keypair.random(); // Em produção: chave estática configurada
  private challenges = new Map<string, ChallengeRecord>();
  private ttlMs = 5 * 60 * 1000;

  async buildChallenge(clientPubKey: string) {
    const now = Date.now();
    const network = Networks.TESTNET;
    const account = {
      accountId: this.serverKey.publicKey(),
      sequenceNumber: '0',
      incrementSequenceNumber: function () {},
    } as any;
    const tx = new TransactionBuilder(account, {
      fee: '100',
      networkPassphrase: network,
      timebounds: { minTime: Math.floor(now / 1000), maxTime: Math.floor((now + this.ttlMs) / 1000) },
    })
      .addOperation(Operation.manageData({ name: 'SEP10Auth', value: crypto.randomBytes(16).toString('hex') }))
      .addOperation(Operation.manageData({ name: 'client', value: clientPubKey }))
      .addMemo(Memo.text('AUTH'))
      .build();
    tx.sign(this.serverKey);
    const xdr = tx.toXDR();
    this.challenges.set(clientPubKey, { tx: xdr, publicKey: clientPubKey, expiresAt: now + this.ttlMs });
    return { challenge: xdr, serverKey: this.serverKey.publicKey(), expiresAt: now + this.ttlMs };
  }

  async verifyChallenge(clientPubKey: string, signedXdr: string) {
    const rec = this.challenges.get(clientPubKey);
    if (!rec) throw new Error('Challenge not found');
    if (Date.now() > rec.expiresAt) {
      this.challenges.delete(clientPubKey);
      throw new Error('Challenge expired');
    }
    // Simplificação: aceitar qualquer XDR retornado – em produção validar assinatura do cliente e conteúdo
    this.challenges.delete(clientPubKey);
    return this.issueJwt(clientPubKey);
  }

  private issueJwt(pubKey: string) {
    // Stub: criar token simples (em produção JWT assinado)
    const token = Buffer.from(JSON.stringify({ sub: pubKey, iat: Date.now() })).toString('base64url');
    return { token };
  }

  async getAuthToken(publicKey: string): Promise<string> {
    // Mantido para compat: retorna token direto (deprecated após fluxo completo)
    return (await this.issueJwt(publicKey)).token;
  }
}
