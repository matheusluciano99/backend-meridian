import { Injectable } from '@nestjs/common';

@Injectable()
export class AnchorAuthService {
  // Stub: em produção implementar fluxo SEP-10 (challenge + assinatura)
  async getAuthToken(_publicKey: string): Promise<string> {
    // Retornar token fake por enquanto
    return 'mock-anchor-jwt';
  }
}
