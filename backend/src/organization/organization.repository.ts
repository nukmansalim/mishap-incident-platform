
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';

@Injectable()
export class OrganizationRepository {
    constructor(private prisma: PrismaService) { }
    async create(userId: string, dto: CreateOrganizationDto) {
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
        });
    }
    async findOrgByUserId(userId: string) {

        const findOrganizations = await this.prisma.organizationMember.findMany({
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
        return findOrganizations
    }
    findMembership(orgId: string, userId: string) {
        return this.prisma.organizationMember.findUnique({
            where: {
                organizationId_userId: {
                    organizationId: orgId,
                    userId,
                },
            },
        });
    }
    findMembersByOrganizationId(orgId: string) {
        return this.prisma.organizationMember.findMany({
            where: { organizationId: orgId },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                        status: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'asc',
            },
        });
    }
}


