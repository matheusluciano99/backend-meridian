import { Injectable } from '@nestjs/common';
import { PoliciesRepository } from './policies.repository';
import { SorobanService } from '../soroban/soroban.service';
import { xlmToStroops } from '../common/stellar-units';

@Injectable()
export class PoliciesService {
  constructor(
    private readonly repo: PoliciesRepository,
    private readonly sorobanService: SorobanService,
  ) {}

  create(userId: string, productId: string) {
    const policy = { user_id: userId, product_id: productId, status: 'PAUSED' };
    return this.repo.create(policy);
  }

  async activate(id: string) {
    // Primeiro atualiza no banco SQL
    const policy = await this.repo.updateStatus(id, 'ACTIVE');
    
    // Depois registra no contrato inteligente
    try {
      const amountXlm = policy.coverage_amount || 0;
      const amountStroops = xlmToStroops((amountXlm || 0).toString());
      await this.sorobanService.activatePolicy(
        policy.user_id,
        policy.product?.code || 'UNKNOWN',
        amountStroops,
        `manual:${policy.id}`
      );
    } catch (error) {
      console.error('Erro ao ativar apólice no contrato:', error);
      // Reverte status se falhar no contrato
      await this.repo.updateStatus(id, 'PAUSED');
      throw error;
    }
    
    return policy;
  }

  pause(id: string) {
    return this.repo.updateStatus(id, 'PAUSED');
  }

  findAll() {
    return this.repo.findAll();
  }

  findAllByUser(userId: string) {
    return this.repo.findAllByUser(userId);
  }
}
