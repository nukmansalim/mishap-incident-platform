import { Injectable } from '@nestjs/common';
import { CreateOrganizationDTO } from 'src/dto/create-organization.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class OrganizationService {
    constructor(private prisma: PrismaService) { }
    async createOrganization(userId: string, dto: CreateOrganizationDTO) {
        return this.prisma.$transaction(async (tx) => {
            const organization = await tx.organization.create({
                data: {
                    name: dto.name,
                },
            });

            const membership = await tx.organizationMember.create({
                data: {
                    organizationId: organization.id,
                    userId,
                    role: 'owner',
                },
            });

            return { organization, membership };
        })
    }
    async getMyOrganizations(userId: string) {
        const memberships = await this.prisma.organizationMember.findMany({
            where: {
                userId,
            },
            include: {
                organization: true,
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        return memberships.map((membership) => ({
            organizationId: membership.organization.id,
            name: membership.organization.name,
            status: membership.organization.status,
            role: membership.role,
            joinedAt: membership.createdAt,
        }));
    }
}
