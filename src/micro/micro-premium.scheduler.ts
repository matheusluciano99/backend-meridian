import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PoliciesRepository } from '../policies/policies.repository';
import { SorobanService } from '../soroban/soroban.service';
import { xlmToStroops } from '../common/stellar-units';

/**
 * MVP Scheduler de micropagamentos:
 * - A cada intervalo, varre policies ativas com auto_renewal = true
 * - (Por ora) debita um valor simbólico fixo e registra on-chain (collect_premium)
 * - Futuro: persistir eventos em tabela dedicada, validar saldo do usuário e coverage.
 */
@Injectable()
export class MicroPremiumScheduler implements OnModuleInit {
  private readonly logger = new Logger(MicroPremiumScheduler.name);
  private interval: any;
  private readonly PERIOD_MS = 60_000; // 1 minuto (ajustar conforme necessidade)
  private readonly MICRO_XLM = '0.01'; // valor simbólico por ciclo

  constructor(
    private readonly policiesRepo: PoliciesRepository,
    private readonly soroban: SorobanService,
  ) {}

  onModuleInit() {
    this.logger.log('Inicializando scheduler de micropremiums (MVP)...');
    this.interval = setInterval(() => this.tick().catch(err => this.logger.error(err.message)), this.PERIOD_MS);
  }

  async tick() {
    // Buscar todas as policies; em produção filtrar via query (status ACTIVE + auto_renewal=true)
    const all = await this.policiesRepo.findAll();
    const candidates = (all || []).filter(p => p.status === 'ACTIVE' && p.auto_renewal);
    if (!candidates.length) {
      this.logger.verbose('Nenhuma policy elegível para micro premium agora');
      return;
    }
    this.logger.log(`Processando ${candidates.length} policies para micro premium`);
    for (const policy of candidates) {
      try {
        const amountStroops = xlmToStroops(this.MICRO_XLM);
        // Assumindo user_id já é public key ou foi corrigido upstream; se não, pular
        if (!policy.user_id.startsWith('G')) {
          this.logger.warn(`Policy ${policy.id} user_id não é chave pública, pulando`);
          continue;
        }
        const res = await this.soroban.collectPremium(policy.user_id, amountStroops);
        this.logger.log(`Micro premium coletado policy=${policy.id} tx=${res.txHash}`);
      } catch (e: any) {
        this.logger.error(`Falha micro premium policy=${policy.id}: ${e.message}`);
      }
    }
  }
}
