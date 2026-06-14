import { ForbiddenException, Injectable } from '@nestjs/common';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { OrganizationRepository } from './organization.repository';
import { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';
@Injectable()
export class OrganizationService {
  constructor(private readonly organizationRepo: OrganizationRepository) { }
  async createOrganization(userId: string, dto: CreateOrganizationDto) {
    return this.organizationRepo.create(userId, dto)
  }
  async getMyOrganizations(userId: string) {
    const memberships = await this.organizationRepo.findOrgByUserId(userId)

    return memberships.map((membership) => ({
      organizationId: membership.organization.id,
      name: membership.organization.name,
      status: membership.organization.status,
      role: membership.role,
      joinedAt: membership.createdAt,
    }));
  }
  async getOrganizationMembers(orgId: string, user: AuthenticatedUser) {
    const membership = await this.organizationRepo.findMembership(
      orgId,
      user.id,
    );

    if (!membership) {
      throw new ForbiddenException(
        'You are not a member of this organization',
      );
    }

    return this.organizationRepo.findMembersByOrganizationId(orgId);
  }
}
