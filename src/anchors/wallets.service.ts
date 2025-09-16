import { Injectable } from '@nestjs/common';
import { WalletsRepository } from './wallets.repository';
import { Keypair } from '@stellar/stellar-sdk';
import * as crypto from 'crypto';

@Injectable()
export class WalletsService {
  constructor(private readonly repo: WalletsRepository) {}

  private encryptSecret(secret: string) {
    const key = crypto.createHash('sha256').update(process.env.WALLET_SECRET_KEY || 'dev-key').digest();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
    const enc = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([iv, tag, enc]).toString('base64');
  }

  async getOrCreate(userId: string) {
    const existing = await this.repo.findByUser(userId);
    if (existing) return existing;
    const kp = Keypair.random();
    const encrypted_secret = this.encryptSecret(kp.secret());
    return this.repo.create({ user_id: userId, public_key: kp.publicKey(), encrypted_secret });
  }
}
