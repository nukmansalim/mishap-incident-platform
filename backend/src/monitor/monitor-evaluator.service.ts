
import { Injectable } from '@nestjs/common';
import { Monitor, MonitorStatus, MonitorType, IncidentType } from '../../generated/prisma/client';
import { EvaluationResult, ProbeOutcome } from './types';
import { IEvaluationRule, RuleResult } from './interfaces';
import { DownRule } from './rules/down.rule';
import { SslRule } from './rules/ssl.rule';
import { LatencyRule } from './rules/latency.rule';

@Injectable()
export class MonitorEvaluatorService {
    private readonly rules: IEvaluationRule[];

    constructor(
        private readonly downRule: DownRule,
        private readonly sslRule: SslRule,
        private readonly latencyRule: LatencyRule,
    ) {

        this.rules = [this.downRule, this.sslRule, this.latencyRule];
    }

    evaluate(monitor: Monitor, outcome: ProbeOutcome): EvaluationResult {

        const nextCounters = this.calculateCounters(monitor, outcome);


        let finalResult: RuleResult | null = null;

        for (const rule of this.rules) {
            finalResult = rule.evaluate(monitor, outcome, nextCounters);
            if (finalResult) break;
        }


        if (!finalResult) {
            finalResult = {
                status: MonitorStatus.UP,
                incident: null,
                resolves: []
            };
        }

        return {
            nextStatus: finalResult.status,
            openIncident: finalResult.incident,
            resolveIncidentTypes: finalResult.resolves,
            nextCounters,
        };
    }

    private calculateCounters(monitor: Monitor, outcome: ProbeOutcome) {
        let latencyBreaches = monitor.consecutiveLatencyBreaches ?? 0;
        const isSpeedTest = (monitor.type === MonitorType.HTTP || monitor.type === MonitorType.PING);

        if (outcome.latencyMs != null && isSpeedTest) {
            const isWarning = monitor.latencyWarningMs != null && outcome.latencyMs >= monitor.latencyWarningMs;
            const isCritical = monitor.latencyCriticalMs != null && outcome.latencyMs >= monitor.latencyCriticalMs;
            latencyBreaches = (isWarning || isCritical) ? latencyBreaches + 1 : 0;
        } else {
            latencyBreaches = 0;
        }

        return {
            consecutiveFailures: !outcome.ok ? (monitor.consecutiveFailures ?? 0) + 1 : 0,
            consecutiveSuccesses: outcome.ok ? (monitor.consecutiveSuccesses ?? 0) + 1 : 0,
            consecutiveLatencyBreaches: latencyBreaches,
        };
    }
}