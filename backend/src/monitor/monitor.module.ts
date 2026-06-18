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
import { MonitorRunnerService } from "./monitor-runner.service";
import { MonitorStateService } from "./monitor-state.service";

@Module({
    imports: [PrismaModule],
    providers: [MonitorEvaluatorService, MonitorProbeService,
        HttpProbeStrategy, SSLProbeStrategy, PingProbeStrategy,
        DownRule, SslRule, LatencyRule, MonitorRunnerService, MonitorStateService
    ],
    exports: [MonitorEvaluatorService, MonitorProbeService]
})
export class MonitorModule { }