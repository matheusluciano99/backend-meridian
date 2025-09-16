import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

interface LedgerEvent {
  [key: string]: any;
}

@Injectable()
export class LedgerRepository {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_KEY!,
    );
  }

  async add(event: LedgerEvent) {
    const { data, error } = await this.supabase
      .from('ledger')
      .insert([event])
      .select();
    if (error) throw error;
    return data[0];
  }

  async findAll() {
    const { data, error } = await this.supabase
      .from('ledger')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async findByUser(userId: string) {
    const { data, error } = await this.supabase
      .from('ledger')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async findByPolicyAndType(policyId: string, eventType: string) {
    const { data, error } = await this.supabase
      .from('ledger')
      .select('*')
      .eq('policy_id', policyId)
      .eq('event_type', eventType)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }
}
