import { Controller, Post, Body } from '@nestjs/common';
import { AnchorsService } from '../anchors/anchors.service';

interface WebhookBody {
  transaction?: {
    status: string;
    id: string;
  };
}

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly anchorsService: AnchorsService) {}

  @Post('anchor')
  async handleAnchor(@Body() body: WebhookBody) {
    return this.anchorsService.handleWebhook(body);
  }
}
