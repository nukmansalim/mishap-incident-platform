import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Invitation, InviteStatus } from '../../generated/prisma/client';
import { User, OrganizationRole } from '../../generated/prisma/client';

@Injectable()
export class InvitationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByEmailAndOrg(email: string, orgId: string) {
    return this.prisma.invitation.findUnique({
      where: {
        email_organizationId: {
          email,
          organizationId: orgId,
        },
      },
    });
  }

  async createOrResetInvitation(params: {
    email: string;
    orgId: string;
    invitedById: string;
    role: OrganizationRole;
    expiresAt: Date;
  }): Promise<Invitation> {
    const { email, orgId, invitedById, role, expiresAt } = params;
    const token = crypto.randomUUID();

    return this.prisma.invitation.upsert({
      where: {
        email_organizationId: {
          email,
          organizationId: orgId,
        },
      },
      update: {
        status: InviteStatus.PENDING,
        token,
        expiresAt,
        invitedById,
        role,
      },
      create: {
        email,
        organization: {
          connect: { id: orgId },
        },
        invitedBy: {
          connect: { id: invitedById },
        },
        token,
        status: InviteStatus.PENDING,
        expiresAt,
        role,
      },
    });
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async isUserMemberOfOrgByEmail(
    email: string,
    orgId: string,
  ): Promise<boolean> {
    const user = await this.findUserByEmail(email);
    if (!user) return false;

    const membership = await this.prisma.organizationMember.findFirst({
      where: {
        userId: user.id,
        organizationId: orgId,
      },
    });

    return !!membership;
  }

  async findByToken(token: string): Promise<Invitation | null> {
    return this.prisma.invitation.findUnique({ where: { token } });
  }
  async acceptInvitationTx(data: {
    userId: string;
    organizationId: string;
    role: OrganizationRole;
    invitationId: string;
  }) {
    return this.prisma.$transaction(async (tx) => {
      await tx.organizationMember.create({
        data: {
          userId: data.userId,
          organizationId: data.organizationId,
          role: data.role,
        },
      });

      return tx.invitation.update({
        where: { id: data.invitationId },
        data: {
          status: 'ACCEPTED',
          acceptedAt: new Date(),
          userId: data.userId,
        },
      });
    });
  }
  async updateStatus(id: string, status: InviteStatus) {
    return this.prisma.invitation.update({
      where: { id },
      data: { status },
    });
  }
}
