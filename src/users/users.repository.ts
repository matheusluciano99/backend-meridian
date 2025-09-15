import { Injectable } from '@nestjs/common';
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
