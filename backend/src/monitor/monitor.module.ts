import { Module } from "@nestjs/common";
import { MonitorEvaluatorService } from "./monitor-evaluator.service";
import { MonitorProbeService } from "./monitor-probe.service";



@Module({
    providers: [MonitorEvaluatorService, MonitorProbeService]
})
export class MonitorModule { }