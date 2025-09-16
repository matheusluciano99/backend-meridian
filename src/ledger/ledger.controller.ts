import { Controller, Get, Post, Body, Query } from '@nestjs/common';
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
  findAll(@Query('userId') userId?: string) {
    if (userId) {
      return this.ledgerService.findByUser(userId);
    }
    return this.ledgerService.findAll();
  }
}
