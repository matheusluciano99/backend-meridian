import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { AnchorAuthService } from './anchor-auth.service';
import { AnchorsService } from './anchors.service';

interface DepositBody {
  userId: string;
  amount: number;
  policyId?: string;
}

@Controller('anchors')
export class AnchorsController {
  constructor(
    private readonly anchorsService: AnchorsService,
    private readonly authService: AnchorAuthService,
  ) {}

  @Post('deposit')
  startDeposit(@Body() body: DepositBody) {
    return this.anchorsService.startDeposit(body.userId, body.amount, body.policyId);
  }

  @Get('transactions')
  list(@Query('userId') userId: string) {
    return this.anchorsService.listTransactions(userId);
  }

  @Get('account')
  account(@Query('userId') userId: string) {
    return this.anchorsService.getAccountInfo(userId);
  }

  @Get('reconcile')
  reconcile() {
    return this.anchorsService.reconcileDeposits();
  }

  @Get('sep24/refresh')
  refresh(@Query('id') id: string) {
    return this.anchorsService.refreshSep24(id);
  }

  @Get('balance')
  balance(@Query('userId') userId: string) {
    return this.anchorsService.userBalance(userId);
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
