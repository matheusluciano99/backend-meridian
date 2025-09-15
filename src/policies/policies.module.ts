import { Module } from '@nestjs/common';
import { PoliciesService } from './policies.service';
import { PoliciesController } from './policies.controller';
import { PoliciesRepository } from './policies.repository';

@Module({
  controllers: [PoliciesController],
  providers: [PoliciesService, PoliciesRepository],
})
export class PoliciesModule {}
