import { Module } from '@nestjs/common';
import { ClaimsController } from './claims.controller';
import { ClaimsService } from './claims.service';
import { ClaimsRepository } from './claims.repository';
import { PoliciesRepository } from '../policies/policies.repository';

@Module({
  controllers: [ClaimsController],
  providers: [ClaimsService, ClaimsRepository, PoliciesRepository],
})
export class ClaimsModule {}
