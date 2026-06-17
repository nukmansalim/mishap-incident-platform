import { Injectable } from '@nestjs/common';
import { IncidentSeverity, MonitorStatus, MonitorType, IncidentType } from 'generated/prisma/enums';
import { Monitor, } from 'generated/prisma/client';
import { EvaluationResult, ProbeOutcome } from './types';
interface RuleResult {
    status: MonitorStatus;
    incident: EvaluationResult['openIncident'];
    resolves: IncidentType[];
}

@Injectable()
export class MonitorEvaluatorService {

    private readonly ALL_INCIDENTS = Object.values(IncidentType);

    evaluate(monitor: Monitor, outcome: ProbeOutcome): EvaluationResult {

        const counters = this.calculateCounters(monitor, outcome);


        const result =
            this.evaluateDownRule(monitor, outcome, counters) ??
            this.evaluateSslRule(monitor, outcome) ??
            this.evaluateLatencyRule(monitor, outcome, counters) ??
            this.getHealthyResult();


        return {
            nextStatus: result.status,
            openIncident: result.incident,
            resolveIncidentTypes: result.resolves,
            nextCounters: counters,
        };
    }



    private calculateCounters(monitor: Monitor, outcome: ProbeOutcome) {
        let latencyBreaches = monitor.consecutiveLatencyBreaches ?? 0;

        if (outcome.latencyMs != null && [MonitorType.HTTP, MonitorType.PING] as MonitorType[]) {
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



    private resolveAllExcept(typeToKeepOpen?: IncidentType): IncidentType[] {
        if (!typeToKeepOpen) return [...this.ALL_INCIDENTS];
        return this.ALL_INCIDENTS.filter((type) => type !== typeToKeepOpen);
    }



    private evaluateDownRule(
        monitor: Monitor,
        outcome: ProbeOutcome,
        counters: ReturnType<typeof this.calculateCounters>
    ): RuleResult | null {
        if (outcome.ok) return null;

        if (counters.consecutiveFailures >= (monitor.failureThreshold ?? 1)) {
            return {
                status: MonitorStatus.DOWN,
                incident: {
                    type: IncidentType.DOWN,
                    severity: IncidentSeverity.CRITICAL,
                    title: `${monitor.name} is down`,
                    description: outcome.errorMessage ?? 'Probe failed',
                },
                resolves: this.resolveAllExcept(IncidentType.DOWN),
            };
        }


        return {
            status: monitor.status,
            incident: null,
            resolves: [],
        };
    }

    private evaluateSslRule(monitor: Monitor, outcome: ProbeOutcome): RuleResult | null {
        if (monitor.type !== MonitorType.SSL) return null;

        if (outcome.sslValid === false) {
            return {
                status: MonitorStatus.DOWN,
                incident: {
                    type: IncidentType.SSL_INVALID,
                    severity: IncidentSeverity.CRITICAL,
                    title: `${monitor.name} SSL is invalid`,
                    description: 'Certificate invalid, expired, or handshake failed',
                },
                resolves: this.resolveAllExcept(IncidentType.SSL_INVALID),
            };
        }

        if (outcome.sslDaysRemaining != null) {
            const isCritical = monitor.sslCriticalDays != null && outcome.sslDaysRemaining <= monitor.sslCriticalDays;
            const isWarning = monitor.sslWarningDays != null && outcome.sslDaysRemaining <= monitor.sslWarningDays;

            if (isCritical || isWarning) {
                return {
                    status: MonitorStatus.DEGRADED,
                    incident: {
                        type: IncidentType.SSL_EXPIRING,
                        severity: isCritical ? IncidentSeverity.CRITICAL : IncidentSeverity.WARNING,
                        title: `${monitor.name} SSL expires soon`,
                        description: `Certificate expires in ${outcome.sslDaysRemaining} days`,
                    },
                    resolves: this.resolveAllExcept(IncidentType.SSL_EXPIRING),
                };
            }
        }

        return null;
    }

    private evaluateLatencyRule(
        monitor: Monitor,
        outcome: ProbeOutcome,
        counters: ReturnType<typeof this.calculateCounters>
    ): RuleResult | null {
        if (counters.consecutiveLatencyBreaches === 0) return null;
        if (counters.consecutiveLatencyBreaches < (monitor.latencyBreachThreshold ?? 1)) return null;

        const isCritical = monitor.latencyCriticalMs != null && outcome.latencyMs! >= monitor.latencyCriticalMs;

        return {
            status: MonitorStatus.DEGRADED,
            incident: {
                type: IncidentType.HIGH_LATENCY,
                severity: isCritical ? IncidentSeverity.CRITICAL : IncidentSeverity.WARNING,
                title: `${monitor.name} latency is high`,
                description: `Latency ${outcome.latencyMs} ms`,
            },
            resolves: this.resolveAllExcept(IncidentType.HIGH_LATENCY),
        };
    }

    private getHealthyResult(): RuleResult {
        return {
            status: MonitorStatus.UP,
            incident: null,
            resolves: this.resolveAllExcept(),
        };
    }
}