import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { AnchorsService } from './anchors.service';
import { AnchorsController } from './anchors.controller';
import { AnchorsRepository } from './anchors.repository';

@Module({
  imports: [HttpModule],
  controllers: [AnchorsController],
  providers: [AnchorsService, AnchorsRepository],
  exports: [AnchorsService],
})
export class AnchorsModule {}
