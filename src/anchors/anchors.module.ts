import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AnchorsService } from './anchors.service';
import { AnchorsController } from './anchors.controller';
import { AnchorsRepository } from './anchors.repository';
import { WalletsRepository } from './wallets.repository';
import { WalletsService } from './wallets.service';
import { AnchorTransactionsRepository } from './anchor-transactions.repository';
import { AnchorAuthService } from './anchor-auth.service';
import { StellarUtilityService } from './stellar-utility.service';
import { LedgerRepository } from '../ledger/ledger.repository';
import { UsersRepository } from '../users/users.repository';

@Module({
  imports: [HttpModule],
  controllers: [AnchorsController],
  providers: [
    AnchorsService,
    AnchorsRepository,
    WalletsRepository,
    WalletsService,
    AnchorTransactionsRepository,
    AnchorAuthService,
    StellarUtilityService,
    LedgerRepository,
    UsersRepository,
  ],
  exports: [AnchorsService],
})
export class AnchorsModule {}
