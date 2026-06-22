import { Injectable } from '@nestjs/common';
import {
  IncidentSeverity,
  IncidentType,
  Monitor,
  MonitorStatus,
  MonitorType,
} from '../../../generated/prisma/client';
import { IEvaluationRule, RuleResult } from '../interfaces';
import { ProbeOutcome } from '../types';

@Injectable()
export class SslRule implements IEvaluationRule {
  evaluate(monitor: Monitor, outcome: ProbeOutcome): RuleResult | null {
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
        resolves: [
          IncidentType.DOWN,
          IncidentType.HIGH_LATENCY,
          IncidentType.SSL_EXPIRING,
        ],
      };
    }

    if (outcome.sslDaysRemaining != null) {
      const isCritical =
        monitor.sslCriticalDays != null &&
        outcome.sslDaysRemaining <= monitor.sslCriticalDays;
      const isWarning =
        monitor.sslWarningDays != null &&
        outcome.sslDaysRemaining <= monitor.sslWarningDays;

      if (isCritical || isWarning) {
        return {
          status: MonitorStatus.DEGRADED,
          incident: {
            type: IncidentType.SSL_EXPIRING,
            severity: isCritical
              ? IncidentSeverity.CRITICAL
              : IncidentSeverity.WARNING,
            title: `${monitor.name} SSL expires soon`,
            description: `Certificate expires in ${outcome.sslDaysRemaining} days`,
          },
          resolves: [
            IncidentType.DOWN,
            IncidentType.HIGH_LATENCY,
            IncidentType.SSL_INVALID,
          ],
        };
      }
    }

    return null;
  }
}
