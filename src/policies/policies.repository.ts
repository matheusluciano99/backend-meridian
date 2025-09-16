import { Injectable } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

interface Policy {
  user_id: string;
  product_id: string;
  status: string;
  premium_amount?: number;
  coverage_amount?: number;
  start_date?: string;
  end_date?: string;
  auto_renewal?: boolean;
  billing_model?: string;
  hourly_rate_xlm?: number;
  funding_balance_xlm?: number;
  total_premium_paid_xlm?: number;
  coverage_limit_xlm?: number;
  next_charge_at?: string | null;
  last_charge_at?: string | null;
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

  async updateFields(id: string, fields: Record<string, any>) {
    const { data, error } = await this.supabase
      .from('policies')
      .update(fields)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data[0];
  }

  async increaseFunding(id: string, amount: number) {
    // Usa RPC: update with expression not directly supported; fazer fetch + update simples
    const current = await this.findById(id);
    const newFunding = (current.funding_balance_xlm || 0) + amount;
    const { data, error } = await this.supabase
      .from('policies')
      .update({ funding_balance_xlm: newFunding })
      .eq('id', id)
      .select();
    if (error) throw error;
    return data[0];
  }

  async findById(id: string) {
    const { data, error } = await this.supabase
      .from('policies')
      .select(`*, product:products(*)`)
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  }

  async findAll() {
    const { data, error } = await this.supabase
      .from('policies')
      .select(`
        *,
        product:products(*)
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  /**
   * Retorna policies de um usuário específico.
   * Também atualiza em memória (na resposta) o status para EXPIRED caso a data atual já tenha passado do end_date
   * (não persiste automaticamente para evitar writes a cada leitura; isso pode virar um job futuramente).
   */
  async findAllByUser(userId: string) {
    const { data, error } = await this.supabase
      .from('policies')
      .select(`
        *,
        product:products(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    if (!data) return [];
    const now = new Date();
    return data.map(p => {
      if (p.status !== 'EXPIRED' && p.end_date && new Date(p.end_date) < now) {
        return { ...p, status: 'EXPIRED' };
      }
      return p;
    });
  }
}
