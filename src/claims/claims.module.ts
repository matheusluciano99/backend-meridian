import { Module } from '@nestjs/common';
import { ClaimsController } from './claims.controller';
import { ClaimsService } from './claims.service';
import { ClaimsRepository } from './claims.repository';
import { PoliciesRepository } from '../policies/policies.repository';
import { SorobanModule } from '../soroban/soroban.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [SorobanModule, UsersModule],
  controllers: [ClaimsController],
  providers: [ClaimsService, ClaimsRepository, PoliciesRepository],
})
export class ClaimsModule {}
