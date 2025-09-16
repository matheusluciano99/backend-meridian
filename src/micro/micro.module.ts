import { Module } from '@nestjs/common';
import { MicroPremiumScheduler } from './micro-premium.scheduler';
import { PoliciesRepository } from '../policies/policies.repository';
import { SorobanModule } from '../soroban/soroban.module';

@Module({
  imports: [SorobanModule],
  providers: [MicroPremiumScheduler, PoliciesRepository],
})
export class MicroModule {}
