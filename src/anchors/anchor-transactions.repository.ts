import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

interface AnchorTxCreate {
  user_id: string;
  type: 'deposit' | 'withdraw';
  asset_code?: string;
  amount: number;
  status?: string;
  memo?: string;
  anchor_tx_id?: string;
  extra?: any;
}

@Injectable()
export class AnchorTransactionsRepository {
  private supabase;
  constructor() {
    this.supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
  }

  async create(input: AnchorTxCreate) {
    const { data, error } = await this.supabase
      .from('anchor_transactions')
      .insert([{ ...input }])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async updateStatus(id: string, status: string, anchor_tx_id?: string, extra?: any) {
    const { data, error } = await this.supabase
      .from('anchor_transactions')
      .update({ status, anchor_tx_id, extra })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  async findById(id: string) {
    const { data, error } = await this.supabase
      .from('anchor_transactions')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  async listByUser(userId: string) {
    const { data, error } = await this.supabase
      .from('anchor_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async listPendingDeposits() {
    const { data, error } = await this.supabase
      .from('anchor_transactions')
      .select('*')
      .eq('type', 'deposit')
      .in('status', ['PENDING', 'PENDING_TRUST', 'PENDING_USER_TRANSFER_START'])
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  }
}
