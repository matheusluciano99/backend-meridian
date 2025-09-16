import { Injectable, BadRequestException } from '@nestjs/common';
import { ClaimsRepository } from './claims.repository';
import { PoliciesRepository } from '../policies/policies.repository';
import { SorobanService } from '../soroban/soroban.service';
import { xlmToStroops } from '../common/stellar-units';

@Injectable()
export class ClaimsService {
  // Configuração MVP: produtos que permitem sinistros
  private readonly ALLOWED_PRODUCTS_FOR_CLAIMS = ['INCOME_PER_DIEM'];

  constructor(
    private readonly claimsRepo: ClaimsRepository,
    private readonly policiesRepo: PoliciesRepository,
    private readonly sorobanService: SorobanService,
  ) {}

  async create(userId: string, policyId: string, claimType: string, description: string, incidentDate: string, claimAmount: number) {
    const policy = await this.policiesRepo.findById(policyId);
    if (!policy) throw new BadRequestException('Policy not found');
    if (policy.user_id !== userId) throw new BadRequestException('Policy does not belong to user');
    // Verificar se o produto permite sinistros
    if (!this.ALLOWED_PRODUCTS_FOR_CLAIMS.includes(policy.product?.code)) {
      const allowedProducts = this.ALLOWED_PRODUCTS_FOR_CLAIMS.join(', ');
      throw new BadRequestException(
        `Sinistros são permitidos apenas para produtos: ${allowedProducts}. ` +
        `Produto atual: ${policy.product?.name || 'Desconhecido'} (${policy.product?.code || 'N/A'})`
      );
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
    let payoutHash: string | undefined;
    try {
      const stroops = xlmToStroops(approvedAmount.toString());
      const res = await this.sorobanService.payout(claim.user_id, stroops);
      payoutHash = res.txHash;
    } catch (error) {
      console.error('Erro ao executar payout no contrato:', error);
      // Reverte status se falhar no contrato
      await this.claimsRepo.updateStatus(claimId, 'approved');
      throw error;
    }
    const updated = await this.claimsRepo.findById(claimId);
    return { ...updated, payout_tx_hash: payoutHash };
  }

  findAllByUser(userId: string) {
    return this.claimsRepo.findAllByUser(userId);
  }

  // Método público para verificar se um produto permite sinistros
  isProductEligibleForClaims(productCode: string): boolean {
    return this.ALLOWED_PRODUCTS_FOR_CLAIMS.includes(productCode);
  }

  // Método público para obter lista de produtos elegíveis
  getAllowedProductsForClaims(): string[] {
    return [...this.ALLOWED_PRODUCTS_FOR_CLAIMS];
  }
}
