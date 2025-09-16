import { Injectable } from '@nestjs/common';

export interface PremiumRefRecord {
  ref: string;
  policy_id: string;
  user_id: string;
  amount_xlm: number;
  tx_hash?: string;
  collected?: boolean;
  created_at?: string;
}
import { createClient } from '@supabase/supabase-js';

@Injectable()
export class PremiumRefsRepository {
  private supabase;
  constructor() {
    this.supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
  }

  async exists(ref: string) {
    const { data, error } = await this.supabase
      .from('premium_refs')
      .select('ref')
      .eq('ref', ref)
      .maybeSingle();
    if (error) throw error;
    return !!data;
  }

  async save(entry: PremiumRefRecord) {
    const { data, error } = await this.supabase
      .from('premium_refs')
      .insert([entry])
      .select();
    if (error) throw error;
    return data[0];
  }

  async listByPolicy(policyId: string): Promise<PremiumRefRecord[]> {
    const { data, error } = await this.supabase
      .from('premium_refs')
      .select('*')
      .eq('policy_id', policyId)
      .order('ref', { ascending: false });
    if (error) throw error;
    return data || [];
  }
}
