import { Module } from '@nestjs/common';
import { PoliciesService } from './policies.service';
import { PoliciesController } from './policies.controller';
import { PoliciesRepository } from './policies.repository';
import { ProductsRepository } from '../products/products.repository';
import { SorobanModule } from '../soroban/soroban.module';
import { LedgerModule } from '../ledger/ledger.module';
import { PoliciesBillingScheduler } from './policies.scheduler';
import { PremiumRefsRepository } from './premium-refs.repository';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [SorobanModule, LedgerModule, UsersModule],
  controllers: [PoliciesController],
  providers: [PoliciesService, PoliciesRepository, ProductsRepository, PoliciesBillingScheduler, PremiumRefsRepository],
  exports: [PoliciesRepository, PoliciesService],
})
export class PoliciesModule {}
