import { Injectable } from '@nestjs/common';
import { PoliciesRepository } from './policies.repository';

@Injectable()
export class PoliciesService {
  constructor(private readonly repo: PoliciesRepository) {}

  create(userId: string, productId: string) {
    const policy = { user_id: userId, product_id: productId, status: 'PAUSED' };
    return this.repo.create(policy);
  }

  activate(id: string) {
    return this.repo.updateStatus(id, 'ACTIVE');
  }

  pause(id: string) {
    return this.repo.updateStatus(id, 'PAUSED');
  }

  findAll() {
    return this.repo.findAll();
  }

  findAllByUser(userId: string) {
    return this.repo.findAllByUser(userId);
  }
}
