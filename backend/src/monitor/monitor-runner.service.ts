import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { SchedulerRegistry } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import { MonitorStatus } from 'generated/prisma/enums';
import { MonitorProbeService } from './monitor-probe.service';
import { MonitorEvaluatorService } from './monitor-evaluator.service';
import { MonitorStateService } from './monitor-state.service';

@Injectable()
export class MonitorRunnerService implements OnModuleInit {
    private readonly logger = new Logger(MonitorRunnerService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly schedulerRegistry: SchedulerRegistry,
        private readonly probeService: MonitorProbeService,
        private readonly evaluatorService: MonitorEvaluatorService,
        private readonly stateService: MonitorStateService
    ) { }


    async onModuleInit() {
        this.logger.log('Memulai inisialisasi Monitor Runner...');
        await this.reloadAllMonitors();
    }

    async reloadAllMonitors() {
        this.logger.log('Sinkronisasi ulang jadwal scheduler di memori...');


        const intervals = this.schedulerRegistry.getIntervals();
        for (const intervalName of intervals) {
            if (intervalName.startsWith('monitor-')) {
                this.schedulerRegistry.deleteInterval(intervalName);
            }
        }

        const activeMonitors = await this.prisma.monitor.findMany({
            where: {
                status: { not: MonitorStatus.PAUSED },
            },
        });

        this.logger.log(`Ditemukan ${activeMonitors.length} monitor aktif untuk dijadwalkan.`);

        for (const monitor of activeMonitors) {
            this.startMonitorInterval(monitor);
        }
    }

    private startMonitorInterval(monitor: any) {
        const intervalName = `monitor-${monitor.id}`;
        const intervalMs = monitor.intervalSeconds * 1000;


        if (this.schedulerRegistry.doesExist('interval', intervalName)) {
            this.schedulerRegistry.deleteInterval(intervalName);
        }


        const interval = setInterval(async () => {
            await this.executeTick(monitor.id);
        }, intervalMs);

        this.schedulerRegistry.addInterval(intervalName, interval);
        this.logger.log(`[Scheduled] ${monitor.name} - Setiap ${monitor.intervalSeconds} detik`);
    }


    private async executeTick(monitorId: string) {
        try {

            const monitor = await this.prisma.monitor.findUnique({
                where: { id: monitorId },
            });

            if (!monitor || monitor.status === MonitorStatus.PAUSED) {

                this.schedulerRegistry.deleteInterval(`monitor-${monitorId}`);
                return;
            }


            const outcome = await this.probeService.executeProbe(monitor);


            const evaluation = this.evaluatorService.evaluate(monitor, outcome);

            await this.stateService.persistEvaluation(monitorId, outcome, evaluation)
            this.logger.debug(`[TICK] ${monitor.name} | Status Next: ${evaluation.nextStatus}`);

        } catch (error: any) {
            this.logger.error(`Gagal mengeksekusi tick untuk monitor ${monitorId}: ${error.message}`);
        }
    }
}