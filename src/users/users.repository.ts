import { Injectable } from '@nestjs/common';
import { Keypair, StrKey } from '@stellar/stellar-sdk';
import { createClient } from '@supabase/supabase-js';

interface User {
  [key: string]: any;
}

@Injectable()
export class UsersRepository {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_KEY!,
    );
  }

  async create(user: User) {
    const { data, error } = await this.supabase
      .from('users')
      .insert([user])
      .select();
    if (error) throw error;
    return data[0];
  }

  async findAll() {
    const { data, error } = await this.supabase.from('users').select('*');
    if (error) throw error;
    return data;
  }

  async findById(id: string) {
    const { data, error } = await this.supabase.from('users').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data;
  }

  private isValidStellarAddress(addr?: string | null): boolean {
    if (!addr) return false;
    if (addr.length !== 56) return false;
    try {
      return StrKey.isValidEd25519PublicKey(addr);
    } catch {
      return false;
    }
  }

  async ensureWalletAddress(id: string) {
    let user = await this.findById(id);
    if (!user) return null;
    if (this.isValidStellarAddress(user.wallet_address)) return user;
    // generate new keypair
    const kp = Keypair.random();
    const publicKey = kp.publicKey();
    const { data, error } = await this.supabase
      .from('users')
      .update({ wallet_address: publicKey })
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async updateKycStatus(id: string, status: string) {
    const { data, error } = await this.supabase
      .from('users')
      .update({ kyc_status: status })
      .eq('id', id)
      .select();
    if (error) throw error;
    return data[0];
  }
}
