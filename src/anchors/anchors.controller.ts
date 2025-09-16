import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { AnchorAuthService } from './anchor-auth.service';
import { AnchorsService } from './anchors.service';

interface DepositBody {
  userId: string;
  amount: number;
}

@Controller('anchors')
export class AnchorsController {
  constructor(
    private readonly anchorsService: AnchorsService,
    private readonly authService: AnchorAuthService,
  ) {}

  @Post('deposit')
  startDeposit(@Body() body: DepositBody) {
    return this.anchorsService.startDeposit(body.userId, body.amount);
  }

  @Get('transactions')
  list(@Query('userId') userId: string) {
    return this.anchorsService.listTransactions(userId);
  }

  @Get('reconcile')
  reconcile() {
    return this.anchorsService.reconcileDeposits();
  }

  @Post('auth/challenge')
  buildChallenge(@Body() body: { publicKey: string }) {
    return this.authService.buildChallenge(body.publicKey);
  }

  @Post('auth/verify')
  verify(@Body() body: { publicKey: string; signedXdr: string }) {
    return this.authService.verifyChallenge(body.publicKey, body.signedXdr);
  }
}
