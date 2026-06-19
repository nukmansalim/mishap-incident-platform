import { Module } from "@nestjs/common";
import { MonitorEvaluatorService } from "./monitor-evaluator.service";
import { MonitorProbeService } from "./monitor-probe.service";
import { HttpProbeStrategy } from "./strategies/http-probe.strategy";
import { SSLProbeStrategy } from "./strategies/ssl-probe.strategy";
import { PingProbeStrategy } from "./strategies/ping-probe.strategy";
import { DownRule } from "./rules/down.rule";
import { SslRule } from "./rules/ssl.rule";
import { LatencyRule } from "./rules/latency.rule";

import { PrismaModule } from "src/prisma/prisma.module";
import { MonitorStateService } from "./monitor-state.service";
import { BullModule } from "@nestjs/bullmq";
import { healthQueueConfig } from "./queue/queue.config";
import { MonitorSchedulerService } from "./producer/monitor-scheduler.service";
import { MonitorConsumerService } from "./consumer/monitor.consumer.service";

@Module({
    imports: [PrismaModule, BullModule.registerQueue(healthQueueConfig)],
    providers: [MonitorEvaluatorService, MonitorProbeService,
        HttpProbeStrategy, SSLProbeStrategy, PingProbeStrategy,
        DownRule, SslRule, LatencyRule, MonitorSchedulerService, MonitorConsumerService, MonitorStateService
    ],
    exports: [MonitorEvaluatorService, MonitorProbeService]
})
export class MonitorModule { }