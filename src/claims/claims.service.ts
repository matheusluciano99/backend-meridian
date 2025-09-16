import { Injectable, BadRequestException } from '@nestjs/common';
import { ClaimsRepository } from './claims.repository';
import { PoliciesRepository } from '../policies/policies.repository';
import { SorobanService } from '../soroban/soroban.service';

@Injectable()
export class ClaimsService {
  constructor(
    private readonly claimsRepo: ClaimsRepository,
    private readonly policiesRepo: PoliciesRepository,
    private readonly sorobanService: SorobanService,
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

  async approveClaim(claimId: string, approvedAmount: number) {
    // Busca o claim
    const claim = await this.claimsRepo.findById(claimId);
    if (!claim) throw new BadRequestException('Claim not found');
    
    // Verifica se já foi pago
    if (claim.status === 'paid') throw new BadRequestException('Claim already paid');
    
    // Atualiza status e valor aprovado no banco
    await this.claimsRepo.updateStatus(claimId, 'paid');
    await this.claimsRepo.updateApprovedAmount(claimId, approvedAmount);
    
    // Executa payout no contrato inteligente
    try {
      await this.sorobanService.payout(claim.user_id, approvedAmount);
    } catch (error) {
      console.error('Erro ao executar payout no contrato:', error);
      // Reverte status se falhar no contrato
      await this.claimsRepo.updateStatus(claimId, 'approved');
      throw error;
    }
    
    return this.claimsRepo.findById(claimId);
  }

  findAllByUser(userId: string) {
    return this.claimsRepo.findAllByUser(userId);
  }
}
