import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { AnchorsService } from './anchors.service';

interface DepositBody {
  userId: string;
  amount: number;
}

@Controller('anchors')
export class AnchorsController {
  constructor(private readonly anchorsService: AnchorsService) {}

  @Post('deposit')
  startDeposit(@Body() body: DepositBody) {
    return this.anchorsService.startDeposit(body.userId, body.amount);
  }

  @Get('transactions')
  list(@Query('userId') userId: string) {
    return this.anchorsService.listTransactions(userId);
  }
}
