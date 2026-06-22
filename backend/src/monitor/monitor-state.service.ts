import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  IncidentStatus,
  MonitorEventType,
} from '../../generated/prisma/client';
import { ProbeOutcome, EvaluationResult } from './types';

@Injectable()
export class MonitorStateService {
  private readonly logger = new Logger(MonitorStateService.name);

  constructor(private readonly prisma: PrismaService) {}

  async persistEvaluation(
    monitorId: string,
    outcome: ProbeOutcome,
    evaluation: EvaluationResult,
  ) {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        let createdIncidentId: string | null = null;
        await tx.monitorCheckLog.create({
          data: {
            monitorId,
            success: outcome.ok,
            derivedStatus: evaluation.nextStatus,
            latencyMs: outcome.latencyMs,
            httpStatus: outcome.httpStatus,
            sslDaysRemaining: outcome.sslDaysRemaining,
            errorMessage: outcome.errorMessage,
          },
        });

        await tx.monitor.update({
          where: { id: monitorId },
          data: {
            status: evaluation.nextStatus,
            consecutiveFailures: evaluation.nextCounters.consecutiveFailures,
            consecutiveSuccesses: evaluation.nextCounters.consecutiveSuccesses,
            consecutiveLatencyBreaches:
              evaluation.nextCounters.consecutiveLatencyBreaches,
          },
        });

        if (evaluation.resolveIncidentTypes.length > 0) {
          const openIncidents = await tx.incident.findMany({
            where: {
              monitorId,
              status: IncidentStatus.OPEN,
              type: { in: evaluation.resolveIncidentTypes },
            },
          });

          for (const incident of openIncidents) {
            await tx.incident.update({
              where: { id: incident.id },
              data: {
                status: IncidentStatus.RESOLVED,
                resolvedAt: new Date(),
              },
            });

            await tx.monitorEvent.create({
              data: {
                monitorId,
                incidentId: incident.id,
                eventType: MonitorEventType.INCIDENT_RESOLVED,
                message: `Incident ${incident.type} resolved automatically.`,
              },
            });
          }
        }

        if (evaluation.openIncident) {
          const existingIncident = await tx.incident.findFirst({
            where: {
              monitorId,
              status: IncidentStatus.OPEN,
              type: evaluation.openIncident.type,
            },
          });

          if (!existingIncident) {
            const newIncident = await tx.incident.create({
              data: {
                monitorId,
                title: evaluation.openIncident.title,
                description: evaluation.openIncident.description,
                type: evaluation.openIncident.type,
                severity: evaluation.openIncident.severity,
              },
            });
            createdIncidentId = newIncident.id;
            await tx.monitorEvent.create({
              data: {
                monitorId,
                incidentId: newIncident.id,
                eventType: MonitorEventType.INCIDENT_OPENED,
                toStatus: evaluation.nextStatus,
                message: evaluation.openIncident.description,
              },
            });

            this.logger.warn(
              `🚨 INSIDEN BARU: ${evaluation.openIncident.title}`,
            );
          }
        }
        return { createdIncidentId };
      });
      return result;
    } catch (error: any) {
      this.logger.error(
        `Gagal menyimpan state untuk monitor ${monitorId}: ${error.message}`,
      );
      throw error;
    }
  }
}
