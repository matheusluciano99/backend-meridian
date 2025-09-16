import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

interface WalletRecord {
  user_id: string;
  public_key: string;
  encrypted_secret: string;
}

@Injectable()
export class WalletsRepository {
  private supabase;
  constructor() {
    this.supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
  }

  async findByUser(userId: string) {
    const { data, error } = await this.supabase.from('user_wallets').select('*').eq('user_id', userId).maybeSingle();
    if (error) throw error;
    return data;
  }

  async create(record: WalletRecord) {
    const { data, error } = await this.supabase.from('user_wallets').insert([record]).select().single();
    if (error) throw error;
    return data;
  }
}
