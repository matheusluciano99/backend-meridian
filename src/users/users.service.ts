import { Injectable } from '@nestjs/common';
import { UsersRepository } from './users.repository';

interface User {
  [key: string]: any;
}

@Injectable()
export class UsersService {
  constructor(private readonly repo: UsersRepository) {}

  create(user: User) {
    return this.repo.create(user);
  }

  findAll() {
    return this.repo.findAll();
  }

  verifyKyc(id: string) {
    return this.repo.updateKycStatus(id, 'verified');
  }
}
