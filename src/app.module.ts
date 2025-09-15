import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { PoliciesModule } from './policies/policies.module';
import { AnchorsModule } from './anchors/anchors.module';
import { LedgerModule } from './ledger/ledger.module';
import { SorobanModule } from './soroban/soroban.module';
import { WebhooksModule } from './webhooks/webhooks.module';

@Module({
  imports: [
    UsersModule,
    ProductsModule,
    PoliciesModule,
    AnchorsModule,
    LedgerModule,
    SorobanModule,
    WebhooksModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
