import { Injectable } from '@nestjs/common';
import {
  IncidentSeverity,
  IncidentType,
  Monitor,
  MonitorStatus,
} from '../../../generated/prisma/client';
import { IEvaluationRule, RuleResult } from '../interfaces';
import { ProbeOutcome } from '../types';

@Injectable()
export class LatencyRule implements IEvaluationRule {
  evaluate(
    monitor: Monitor,
    outcome: ProbeOutcome,
    counters: any,
  ): RuleResult | null {
    if (counters.consecutiveLatencyBreaches === 0) {
      const successThreshold = monitor.latencyBreachThreshold ?? 1;

      if (counters.consecutiveSuccesses >= successThreshold) {
        return {
          status: MonitorStatus.UP,
          incident: null,
          resolves: [IncidentType.HIGH_LATENCY],
        };
      }

      return null;
    }
    if (
      counters.consecutiveLatencyBreaches <
      (monitor.latencyBreachThreshold ?? 1)
    )
      return null;

    const isCritical =
      monitor.latencyCriticalMs != null &&
      outcome.latencyMs! >= monitor.latencyCriticalMs;

    return {
      status: MonitorStatus.DEGRADED,
      incident: {
        type: IncidentType.HIGH_LATENCY,
        severity: isCritical
          ? IncidentSeverity.CRITICAL
          : IncidentSeverity.WARNING,
        title: `${monitor.name} latency is high`,
        description: `Latency ${outcome.latencyMs} ms`,
      },
      resolves: [
        IncidentType.DOWN,
        IncidentType.SSL_EXPIRING,
        IncidentType.SSL_INVALID,
      ],
    };
  }
}
