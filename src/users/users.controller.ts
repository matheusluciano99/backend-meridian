import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { UsersService } from './users.service';

interface User {
  [key: string]: any;
}

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() user: User) {
    return this.usersService.create(user);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Post(':id/verify')
  verify(@Param('id') id: string) {
    return this.usersService.verifyKyc(id);
  }
}
