import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

interface Payment {
  user_wallet: string;
  amount: number;
  status: string;
}

@Injectable()
export class AnchorsRepository {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_KEY!,
    );
  }

  async create(payment: Payment) {
    const { data, error } = await this.supabase
      .from('payments')
      .insert([payment])
      .select();
    if (error) throw error;
    return data[0];
  }

  async updateStatus(id: string, status: string) {
    const { data, error } = await this.supabase
      .from('payments')
      .update({ status })
      .eq('id', id)
      .select();
    if (error) throw error;
    return data[0];
  }
}
