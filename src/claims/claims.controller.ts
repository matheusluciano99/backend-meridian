import { Controller, Post, Get, Body, Query, Param } from '@nestjs/common';
import { ClaimsService } from './claims.service';

interface CreateClaimDto {
  userId: string;
  policyId: string;
  claimType: string;
  description: string;
  incidentDate: string; // ISO date
  claimAmount: number;
}

interface ApproveClaimDto {
  approvedAmount: number;
}

@Controller('claims')
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Post()
  create(@Body() body: CreateClaimDto) {
    return this.claimsService.create(
      body.userId,
      body.policyId,
      body.claimType,
      body.description,
      body.incidentDate,
      body.claimAmount,
    );
  }

  @Post(':id/approve')
  approve(@Param('id') id: string, @Body() body: ApproveClaimDto) {
    return this.claimsService.approveClaim(id, body.approvedAmount);
  }

  @Get()
  findAll(@Query('userId') userId: string) {
    return this.claimsService.findAllByUser(userId);
  }

  @Get('eligible-products')
  getEligibleProducts() {
    return {
      allowedProducts: [], // Todos os produtos são elegíveis
      message: 'Todos os produtos permitem sinistros'
    };
  }
}
