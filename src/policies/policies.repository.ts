import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

interface Policy {
  user_id: string;
  product_id: string;
  status: string;
}

@Injectable()
export class PoliciesRepository {
  private supabase;

  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_KEY!,
    );
  }

  async create(policy: Policy) {
    const { data, error } = await this.supabase
      .from('policies')
      .insert([policy])
      .select();
    if (error) throw error;
    return data[0];
  }

  async updateStatus(id: string, status: string) {
    const { data, error } = await this.supabase
      .from('policies')
      .update({ status })
      .eq('id', id)
      .select();
    if (error) throw error;
    return data[0];
  }

  async findAll() {
    const { data, error } = await this.supabase.from('policies').select('*');
    if (error) throw error;
    return data;
  }
}
