import { Controller, Post, Get, Param, Body, Query } from '@nestjs/common';
import { PoliciesService } from './policies.service';

interface CreatePolicyBody {
  userId: string;
  productId: string;
}

@Controller('policies')
export class PoliciesController {
  constructor(private readonly policiesService: PoliciesService) {}

  @Post()
  async create(@Body() body: CreatePolicyBody) {
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

  @Post(':id/fund')
  fund(@Param('id') id: string, @Body() body: { amount: number }) {
    return this.policiesService.fundPolicy(id, Number(body.amount));
  }

  @Get()
  findAll(@Query('userId') userId?: string) {
    if (userId) {
      return this.policiesService.findAllByUser(userId);
    }
    return this.policiesService.findAll();
  }

  @Get(':id/charges')
  getCharges(@Param('id') id: string) {
    return this.policiesService.getCharges(id);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.policiesService.getById(id);
  }

  @Get(':id/onchain')
  getOnchain(@Param('id') id: string) {
    return this.policiesService['sorobanService'].getPolicy(Number(id));
  }
}
