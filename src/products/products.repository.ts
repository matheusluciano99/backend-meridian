import { Injectable } from '@nestjs/common';

@Injectable()
export class ProductsRepository {
  private products = [
    {
      id: '1',
      code: 'ACCIDENT_48H',
      name: 'Acidentes 48h',
      price: 300,
      coverage: 'R$5.000',
    },
    {
      id: '2',
      code: 'INCOME_PER_DIEM',
      name: 'Diária Autônomos',
      price: 250,
      coverage: 'R$50/dia',
    },
  ];

  findAll() {
    return this.products;
  }
}
