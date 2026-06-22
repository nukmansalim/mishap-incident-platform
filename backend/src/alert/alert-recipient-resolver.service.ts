import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TeamRepository } from '../team/team.repository';
import { OrganizationRepository } from '../organization/organization.repository';
import { EscalationTargetType } from '../../generated/prisma/enums';

@Injectable()
export class AlertRecipientResolverService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly teamRepo: TeamRepository,
    private readonly orgRepo: OrganizationRepository,
  ) {}

  async resolveRecipientsForStep(stepId: string) {
    const step = await this.prisma.escalationStep.findUnique({
      where: { id: stepId },
      include: {
        escalationPolicy: {
          include: {
            monitoredService: {
              include: {
                team: true,
                organization: true,
              },
            },
          },
        },
      },
    });

    if (!step) return [];

    const { monitoredService } = step.escalationPolicy;
    const orgId = monitoredService.organizationId;
    const teamId = monitoredService.teamId;

    switch (step.targetType) {
      case EscalationTargetType.USER:
        if (!step.userId) return [];
        return this.prisma.user.findMany({
          where: { id: step.userId },
        });

      case EscalationTargetType.TEAM_ROLE:
        if (!teamId || !step.teamRole) return [];
        // gunakan repo team yang sudah include user
        const members = await this.teamRepo.getMembers(teamId);
        return members
          .filter((m) => m.role === step.teamRole)
          .map((m) => m.user);

      case EscalationTargetType.ORG_ROLE:
        if (!step.organizationRole) return [];
        const orgMembers =
          await this.orgRepo.findMembersByOrganizationId(orgId);
        return orgMembers
          .filter((m) => m.role === step.organizationRole)
          .map((m) => m.user);

      default:
        return [];
    }
  }
}
