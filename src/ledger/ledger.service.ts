import { Injectable } from '@nestjs/common';
import { LedgerRepository } from './ledger.repository';

interface LedgerEvent {
  [key: string]: any;
}

@Injectable()
export class LedgerService {
  constructor(private readonly repo: LedgerRepository) {}

  add(event: LedgerEvent) {
    return this.repo.add(event);
  }

  findAll() {
    return this.repo.findAll();
  }
}
