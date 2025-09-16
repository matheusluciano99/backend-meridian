import { Module } from '@nestjs/common';
import { PoliciesService } from './policies.service';
import { PoliciesController } from './policies.controller';
import { PoliciesRepository } from './policies.repository';
import { ProductsRepository } from '../products/products.repository';
import { SorobanModule } from '../soroban/soroban.module';

@Module({
  imports: [SorobanModule],
  controllers: [PoliciesController],
  providers: [PoliciesService, PoliciesRepository, ProductsRepository],
})
export class PoliciesModule {}
