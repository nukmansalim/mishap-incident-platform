import { InjectQueue } from '@nestjs/bullmq';
import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { AlertRecipientResolverService } from './alert-recipient-resolver.service';
import { ESCALATE_INCIDENT } from './queue/queue.constant';
import { IncidentStatus } from '../../generated/prisma/enums';

@Injectable()
export class AlertEngineService {
  private readonly logger = new Logger(AlertEngineService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly recipientResolver: AlertRecipientResolverService,
    @InjectQueue('alert-engine')
    private readonly alertQueue: Queue,
  ) {}

  async handleIncidentOpened(incidentId: string) {
    const incident = await this.prisma.incident.findUnique({
      where: { id: incidentId },
      include: {
        monitor: {
          include: {
            monitoredService: true,
          },
        },
      },
    });

    if (!incident) return;
    if (incident.status !== IncidentStatus.OPEN) return;

    const policy = await this.prisma.escalationPolicy.findUnique({
      where: {
        monitoredServiceId: incident.monitor.monitoredServiceId,
      },
      include: { steps: true },
    });

    if (!policy || !policy.isActive) {
      this.logger.debug(
        `No active escalation policy for incident ${incidentId}`,
      );
      return;
    }

    const level1 = policy.steps.find((s) => s.level === 1);
    if (!level1) {
      this.logger.warn(`Policy ${policy.id} has no level 1 step`);
      return;
    }

    await this.sendAlertsForStep(incident.id, level1);

    const higherSteps = policy.steps.filter((s) => s.level > 1);
    for (const step of higherSteps) {
      const delayMs = step.delayMinutes * 60 * 1000;
      const jobId = `incident:${incident.id}:level:${step.level}`;
      await this.alertQueue.add(
        ESCALATE_INCIDENT,
        { incidentId: incident.id, stepId: step.id },
        { delay: delayMs, jobId },
      );
    }
  }

  async sendAlertsForStep(incidentId: string, step: any) {
    const recipients = await this.recipientResolver.resolveRecipientsForStep(
      step.id,
    );

    if (!recipients.length) {
      this.logger.warn(
        `No recipients resolved for step ${step.id} level ${step.level}`,
      );
      return;
    }

    for (const user of recipients) {
      await this.prisma.incidentAlert.create({
        data: {
          incidentId,
          escalationStepId: step.id,
          level: step.level,
          channel: 'email',
          recipientUserId: user.id,
          recipientAddress: user.email,
          deliveryStatus: 'SENT',
          sentAt: new Date(),
        },
      });
    }

    await this.prisma.incident.update({
      where: { id: incidentId },
      data: {
        escalationLevel: step.level,
        lastAlertedAt: new Date(),
      },
    });

    this.logger.log(
      `Sent alerts for incident ${incidentId} at level ${step.level} to ${recipients.length} recipients`,
    );
  }

  async acknowledgeIncident(incidentId: string, userId: string) {
    await this.prisma.incident.update({
      where: { id: incidentId },
      data: {
        status: IncidentStatus.ACKED,
        acknowledgedAt: new Date(),
        acknowledgedById: userId,
      },
    });
  }
}
