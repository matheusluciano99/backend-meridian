import { Injectable, BadRequestException } from '@nestjs/common';
import { createClient } from '@supabase/supabase-js';

interface CreateClaimInput {
  user_id: string;
  policy_id: string;
  claim_type: string;
  description: string;
  incident_date: string; // ISO date
  claim_amount: number;
}

@Injectable()
export class ClaimsRepository {
  private supabase;
  constructor() {
    this.supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_KEY!);
  }

  async create(input: CreateClaimInput) {
    const { data, error } = await this.supabase
      .from('claims')
      .insert([
        {
          user_id: input.user_id,
          policy_id: input.policy_id,
          claim_type: input.claim_type,
          description: input.description,
          incident_date: input.incident_date,
          claim_amount: input.claim_amount,
          status: 'submitted'
        }
      ])
      .select();
    if (error) throw new BadRequestException(error.message);
    return data[0];
  }

  async findById(id: string) {
    const { data, error } = await this.supabase
      .from('claims')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  }

  async updateStatus(id: string, status: string) {
    const { data, error } = await this.supabase
      .from('claims')
      .update({ status })
      .eq('id', id)
      .select();
    if (error) throw error;
    return data[0];
  }

  async updateApprovedAmount(id: string, approvedAmount: number) {
    const { data, error } = await this.supabase
      .from('claims')
      .update({ approved_amount: approvedAmount })
      .eq('id', id)
      .select();
    if (error) throw error;
    return data[0];
  }

  async findAllByUser(userId: string) {
    const { data, error } = await this.supabase
      .from('claims')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }

  async findAllByPolicy(policyId: string) {
    const { data, error } = await this.supabase
      .from('claims')
      .select('*')
      .eq('policy_id', policyId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }
}
