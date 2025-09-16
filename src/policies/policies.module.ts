import { Module } from '@nestjs/common';
import { PoliciesService } from './policies.service';
import { PoliciesController } from './policies.controller';
import { PoliciesRepository } from './policies.repository';
import { ProductsRepository } from '../products/products.repository';
import { SorobanModule } from '../soroban/soroban.module';
import { LedgerModule } from '../ledger/ledger.module';
import { PoliciesBillingScheduler } from './policies.scheduler';
import { PremiumRefsRepository } from './premium-refs.repository';

@Module({
  imports: [SorobanModule, LedgerModule],
  controllers: [PoliciesController],
  providers: [PoliciesService, PoliciesRepository, ProductsRepository, PoliciesBillingScheduler, PremiumRefsRepository],
  exports: [PoliciesRepository, PoliciesService],
})
export class PoliciesModule {}
