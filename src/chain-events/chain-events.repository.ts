import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

export interface ChainEventRecord {
  event_type: string;
  tx_hash: string;
  ledger?: number;
  contract_id?: string;
  policy_id?: string;
  user_id?: string;
  payment_ref?: string;
  amount_xlm?: number;
  raw?: any;
}

@Injectable()
export class ChainEventsRepository {
  private supabase;

  constructor() {
    this.supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
  }

  async insert(ev: ChainEventRecord) {
    const { data, error } = await this.supabase.from('chain_events').insert([ev]).select();
    if (error) throw error;
    return data?.[0];
  }

  async findRecent(limit = 50) {
    const { data, error } = await this.supabase
      .from('chain_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data || [];
  }
}
