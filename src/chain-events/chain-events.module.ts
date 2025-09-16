import { Module } from '@nestjs/common';
import { ChainEventsRepository } from './chain-events.repository';
import { ChainEventsService } from './chain-events.service';

@Module({
  providers: [ChainEventsRepository, ChainEventsService],
  exports: [ChainEventsRepository]
})
export class ChainEventsModule {}
