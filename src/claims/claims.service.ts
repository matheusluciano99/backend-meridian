import { Injectable, BadRequestException } from '@nestjs/common';
import { ClaimsRepository } from './claims.repository';
import { PoliciesRepository } from '../policies/policies.repository';

@Injectable()
export class ClaimsService {
  constructor(
    private readonly claimsRepo: ClaimsRepository,
    private readonly policiesRepo: PoliciesRepository,
  ) {}

  async create(userId: string, policyId: string, claimType: string, description: string, incidentDate: string, claimAmount: number) {
    const policy = await this.policiesRepo.findById(policyId);
    if (!policy) throw new BadRequestException('Policy not found');
    if (policy.user_id !== userId) throw new BadRequestException('Policy does not belong to user');
    // Restrição MVP: apenas produto INCOME_PER_DIEM
    if (policy.product?.code !== 'INCOME_PER_DIEM') {
      throw new BadRequestException('Claims only allowed for INCOME_PER_DIEM product in MVP');
    }
    return this.claimsRepo.create({
      user_id: userId,
      policy_id: policyId,
      claim_type: claimType,
      description,
      incident_date: incidentDate,
      claim_amount: claimAmount,
    });
  }

  findAllByUser(userId: string) {
    return this.claimsRepo.findAllByUser(userId);
  }
}
