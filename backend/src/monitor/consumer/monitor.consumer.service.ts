import { Processor, WorkerHost } from "@nestjs/bullmq";
import { Job } from "bullmq";
import { MONITOR_RUN } from "../queue/queue.constant";
import { PrismaService } from "src/prisma/prisma.service";
import { HttpProbeStrategy } from "../strategies/http-probe.strategy";
import { Monitor, MonitorStatus } from "generated/prisma/client";
import { MonitorProbeService } from "../monitor-probe.service";
import { MonitorEvaluatorService } from "../monitor-evaluator.service";
import { MonitorStateService } from "../monitor-state.service";
import { Logger } from "@nestjs/common";

@Processor('health-check')
export class MonitorConsumerService extends WorkerHost {
    private readonly logger = new Logger()
    constructor(
        private readonly monitorProbeService: MonitorProbeService,
        private readonly prisma: PrismaService,
        private readonly evaluatorService: MonitorEvaluatorService,
        private readonly stateService: MonitorStateService

    ) { super() }
    async process(job: Job): Promise<void> {
        if (job.name === MONITOR_RUN) {
            await this.handleProbingCheck(job)
        }

        return;
    }
    async handleProbingCheck(job: Job) {

        try {
            const monitorId = job.data.monitorId
            const monitor = await this.prisma.monitor.findUnique({
                where: { id: monitorId }
            })
            if (!monitor) return;
            if (monitor.status === MonitorStatus.PAUSED) return;
            const outcome = await this.monitorProbeService.executeProbe(monitor)
            const evaluation = this.evaluatorService.evaluate(monitor, outcome)
            await this.stateService.persistEvaluation(monitor.id, outcome, evaluation)
            this.logger.debug(`[TICK] ${monitor.name} | Status Next: ${evaluation.nextStatus}`);

        } catch (error) {
            this.logger.error(`Gagal mengeksekusi tick untuk monitor ${job.data.monitorId}: ${error.message}`);
        }

    }
}