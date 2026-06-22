import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ESCALATE_INCIDENT } from '../queue/queue.constant';
import { PrismaService } from '../../prisma/prisma.service';
import { AlertEngineService } from '../alert.service';
import { IncidentStatus } from '../../../generated/prisma/enums';
import { Logger } from '@nestjs/common';

@Processor('alert-engine')
export class EscalationProcessor extends WorkerHost {
  private readonly logger = new Logger(EscalationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly alertEngine: AlertEngineService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name !== ESCALATE_INCIDENT) return;

    const { incidentId, stepId } = job.data as {
      incidentId: string;
      stepId: string;
    };

    const incident = await this.prisma.incident.findUnique({
      where: { id: incidentId },
    });

    if (!incident) return;
    if (incident.status !== IncidentStatus.OPEN) {
      this.logger.debug(
        `Skip escalation for incident ${incidentId}, status=${incident.status}`,
      );
      return;
    }

    const step = await this.prisma.escalationStep.findUnique({
      where: { id: stepId },
    });

    if (!step) return;

    await this.alertEngine.sendAlertsForStep(incident.id, step);
  }
}
