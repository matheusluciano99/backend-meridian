import { Module } from '@nestjs/common';
import { SorobanService } from './soroban.service';
import { SorobanController } from './soroban.controller';

@Module({
  controllers: [SorobanController],
  providers: [SorobanService],
  exports: [SorobanService],
})
export class SorobanModule {}
