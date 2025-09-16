import { Controller, Get } from '@nestjs/common';
import { SorobanService } from './soroban.service';

@Controller('soroban')
export class SorobanController {
  constructor(private readonly sorobanService: SorobanService) {}

  @Get('pool-balance')
  async getPoolBalance() {
    return this.sorobanService.getPoolBalance();
  }
}