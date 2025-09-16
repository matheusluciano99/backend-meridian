import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ChainEventsRepository } from './chain-events.repository';

// Placeholder: quando os contratos emitirem eventos estruturados (ou via RPC / Horizon / Soroban RPC) 
// este serviço fará polling e persistirá eventos idempotentemente.
@Injectable()
export class ChainEventsService implements OnModuleInit {
  private readonly logger = new Logger(ChainEventsService.name);
  private polling = false;

  constructor(private readonly repo: ChainEventsRepository) {}

  onModuleInit() {
    // Inicia polling leve a cada 60s (pode ser desativado em prod até implementar)
    setInterval(() => {
      if (this.polling) return;
      this.polling = true;
      this.poll().catch(e => this.logger.warn(`Polling error: ${e.message}`)).finally(() => (this.polling = false));
    }, 60 * 1000);
  }

  async poll() {
    // FUTURO: conectar em fonte RPC para obter transações/receipts relacionadas aos contratos
    // Por ora apenas loga placeholder.
    this.logger.debug('ChainEventsService poll tick (placeholder)');
  }
}
