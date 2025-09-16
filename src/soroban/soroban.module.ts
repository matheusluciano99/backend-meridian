import { Module } from '@nestjs/common';
import { SorobanService } from './soroban.service';
import { SorobanController } from './soroban.controller';
import { LedgerModule } from '../ledger/ledger.module';

@Module({
  imports: [LedgerModule],
  controllers: [SorobanController],
  providers: [SorobanService],
  exports: [SorobanService],
})
export class SorobanModule {}
