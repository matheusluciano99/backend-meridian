import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { AnchorsModule } from '../anchors/anchors.module';

@Module({
  imports: [AnchorsModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
