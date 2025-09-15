import { Controller, Post, Body } from '@nestjs/common';
import { AnchorsService } from './anchors.service';

interface DepositBody {
  wallet: string;
  amount: number;
}

@Controller('anchors')
export class AnchorsController {
  constructor(private readonly anchorsService: AnchorsService) {}

  @Post('deposit')
  startDeposit(@Body() body: DepositBody) {
    return this.anchorsService.startDeposit(body.wallet, body.amount);
  }
}
