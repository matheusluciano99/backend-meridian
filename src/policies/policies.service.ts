import { Injectable } from '@nestjs/common';
import { PoliciesRepository } from './policies.repository';
import { SorobanService } from '../soroban/soroban.service';
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
    
    // TODO: Integrar com contrato inteligente quando necessário
    // Por enquanto, apenas ativa no banco de dados
    console.log(`Apólice ${id} ativada com sucesso`);
    
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
