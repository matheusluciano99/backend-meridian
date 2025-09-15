import { Controller, Get, Post, Body } from '@nestjs/common';
import { LedgerService } from './ledger.service';

interface LedgerEvent {
  [key: string]: any;
}

@Controller('ledger')
export class LedgerController {
  constructor(private readonly ledgerService: LedgerService) {}

  @Post()
  add(@Body() event: LedgerEvent) {
    return this.ledgerService.add(event);
  }

  @Get()
  findAll() {
    return this.ledgerService.findAll();
  }
}
