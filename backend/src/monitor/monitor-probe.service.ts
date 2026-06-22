import { Injectable, Logger } from '@nestjs/common';
import { Monitor, MonitorType } from '../../generated/prisma/client';
import { ProbeOutcome } from './types';
import { IProbeStrategy } from './interfaces';
import { HttpProbeStrategy } from './strategies/http-probe.strategy';
import { SSLProbeStrategy } from './strategies/ssl-probe.strategy';
import { PingProbeStrategy } from './strategies/ping-probe.strategy';

@Injectable()
export class MonitorProbeService {
  private readonly logger = new Logger(MonitorProbeService.name);
  private readonly strategies: Map<MonitorType, IProbeStrategy>;

  constructor(
    private readonly httpStrategy: HttpProbeStrategy,
    private readonly sslStrategy: SSLProbeStrategy,
    private readonly pingStrategy: PingProbeStrategy,
  ) {
    this.strategies = new Map([
      [MonitorType.HTTP, this.httpStrategy],
      [MonitorType.SSL, this.sslStrategy],
      [MonitorType.PING, this.pingStrategy],
    ]);
  }

  async executeProbe(monitor: Monitor): Promise<ProbeOutcome> {
    const strategy = this.strategies.get(monitor.type);

    if (!strategy) {
      this.logger.error(`Strategi tidak ditemukan untuk tipe: ${monitor.type}`);
      return {
        ok: false,
        errorMessage: `Tipe monitor tidak didukung: ${monitor.type}`,
      };
    }

    try {
      return await strategy.probe(monitor);
    } catch (error: any) {
      this.logger.error(
        `Probe gagal secara fatal untuk monitor ${monitor.id}: ${error.message}`,
      );
      return { ok: false, errorMessage: error.message };
    }
  }
}
