import { Injectable } from '@nestjs/common';
import { CreateOrganizationDTO } from 'src/dto/create-organization.dto';
import { OrganizationRepository } from './organization.repository';

@Injectable()
export class OrganizationService {
  constructor(private readonly organizationRepo: OrganizationRepository) { }
  async createOrganization(userId: string, dto: CreateOrganizationDTO) {
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
}
