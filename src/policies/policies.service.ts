import { Injectable } from '@nestjs/common';
import { PoliciesRepository } from './policies.repository';
import { SorobanService } from '../soroban/soroban.service';
import { xlmToStroops } from '../common/stellar-units';
import { ProductsRepository } from '../products/products.repository';

@Injectable()
export class PoliciesService {
  constructor(
    private readonly repo: PoliciesRepository,
    private readonly sorobanService: SorobanService,
    private readonly productsRepo: ProductsRepository,
  ) {}

  async create(userId: string, productId: string) {
    // Buscar dados do produto
    const product = await this.productsRepo.findById(productId);
    if (!product) {
      throw new Error(`Product with id ${productId} not found`);
    }

    // Calcular datas
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + product.coverage_duration);

    // Criar apólice com dados completos
    const policy = {
      user_id: userId,
      product_id: productId,
      status: 'PAUSED',
      premium_amount: product.price / 100, // Converter de centavos para reais
      coverage_amount: product.coverage_amount,
      start_date: startDate.toISOString().split('T')[0], // Formato YYYY-MM-DD
      end_date: endDate.toISOString().split('T')[0], // Formato YYYY-MM-DD
      auto_renewal: false
    };

    return this.repo.create(policy);
  }

  async activate(id: string) {
    // Atualiza no banco SQL
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
