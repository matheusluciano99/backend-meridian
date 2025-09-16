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

  async findAllByUser(userId: string) {
    const { data, error } = await this.supabase
      .from('claims')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  }
}
