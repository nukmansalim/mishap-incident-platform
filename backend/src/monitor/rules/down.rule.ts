import { Injectable } from '@nestjs/common';
import { IncidentSeverity, IncidentType, Monitor, MonitorStatus } from '../../../generated/prisma/client';
import { IEvaluationRule, RuleResult } from '../interfaces';
import { ProbeOutcome, EvaluationCounters } from '../types';

@Injectable()
export class DownRule implements IEvaluationRule {
    evaluate(monitor: Monitor, outcome: ProbeOutcome, counters: EvaluationCounters): RuleResult | null {
        if (outcome.ok) return null;
        if (!outcome.ok) {
            if (counters.consecutiveFailures >= (monitor.failureThreshold ?? 1)) {
                return {
                    status: MonitorStatus.DOWN,
                    incident: {
                        type: IncidentType.DOWN,
                        severity: IncidentSeverity.CRITICAL,
                        title: `${monitor.name} is down`,
                        description: outcome.errorMessage ?? 'Probe failed',
                    },
                    resolves: [IncidentType.HIGH_LATENCY, IncidentType.SSL_EXPIRING, IncidentType.SSL_INVALID],
                };
            }

            return {
                status: monitor.status,
                incident: null,
                resolves: [],
            };
        }

        const successThreshold = monitor.successThreshold ?? monitor.failureThreshold ?? 1;

        if (counters.consecutiveSuccesses >= successThreshold) {
            return {
                status: MonitorStatus.UP,
                incident: null,
                resolves: [IncidentType.DOWN],
            };
        }



        return {
            status: MonitorStatus.UP,
            incident: null,
            resolves: [],
        };
    }

}