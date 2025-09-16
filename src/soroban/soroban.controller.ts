import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { SorobanService } from './soroban.service';

@Controller('soroban')
export class SorobanController {
  constructor(private readonly sorobanService: SorobanService) {}

  @Get('pool-balance')
  async getPoolBalance() {
    return this.sorobanService.getPoolBalance();
  }

  @Get('policy/:id')
  async getPolicy(@Param('id', ParseIntPipe) id: number) {
    return this.sorobanService.getPolicy(id);
  }
}