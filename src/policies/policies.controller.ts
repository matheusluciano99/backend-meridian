import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { PoliciesService } from './policies.service';

interface CreatePolicyBody {
  userId: string;
  productId: string;
}

@Controller('policies')
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Post()
  create(@Body() body: CreatePolicyBody) {
    return this.policiesService.create(body.userId, body.productId);
  }

  @Post(':id/activate')
  activate(@Param('id') id: string) {
    return this.policiesService.activate(id);
  }

  @Post(':id/pause')
  pause(@Param('id') id: string) {
    return this.policiesService.pause(id);
  }

  @Get()
  findAll() {
    return this.policiesService.findAll();
  }
}
