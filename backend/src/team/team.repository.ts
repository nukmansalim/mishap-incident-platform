import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { TeamRole, TeamStatus } from 'generated/prisma/enums';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';

@Injectable()
export class TeamRepository {
    constructor(private readonly prisma: PrismaService) { }

    async createTeam(orgId: string, data: CreateTeamDto) {
        return this.prisma.team.create({
            data: {
                organizationId: orgId,
                name: data.name,
                description: data.description,
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
            },
        });
    }

    async findAllByOrg(orgId: string) {
        return this.prisma.team.findMany({
            where: {
                organizationId: orgId,
                status: TeamStatus.active,
            },
            orderBy: {
                createdAt: 'desc',
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
            },
        });
    }

    async findById(teamId: string) {
        return this.prisma.team.findFirst({
            where: {
                id: teamId,
                status: TeamStatus.active,
            },
            include: {
                organization: true,
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                                avatarUrl: true,
                            },
                        },
                    },
                },
            },
        });
    }

    async updateTeam(teamId: string, data: UpdateTeamDto) {
        return this.prisma.team.update({
            where: {
                id: teamId,
            },
            data: {
                ...(data.name !== undefined && { name: data.name }),
                ...(data.description !== undefined && {
                    description: data.description,
                }),
            },
        });
    }

    async deleteTeam(teamId: string) {
        return this.prisma.team.update({
            where: {
                id: teamId,
            },
            data: {
                status: TeamStatus.inactive,
            },
        });
    }

    async addMember(teamId: string, userId: string, role: TeamRole) {
        return this.prisma.teamMember.create({
            data: {
                teamId,
                userId,
                role,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                    },
                },
                team: true,
            },
        });
    }

    async removeMember(teamId: string, userId: string) {
        return this.prisma.teamMember.delete({
            where: {
                teamId_userId: {
                    teamId,
                    userId,
                },
            },
        });
    }

    async getMembers(teamId: string) {
        return this.prisma.teamMember.findMany({
            where: {
                teamId,
            },
            orderBy: {
                createdAt: 'asc',
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                    },
                },
            },
        });
    }

    async updateMemberRole(teamId: string, userId: string, role: TeamRole) {
        return this.prisma.teamMember.update({
            where: {
                teamId_userId: {
                    teamId,
                    userId,
                },
            },
            data: {
                role,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                    },
                },
                team: true,
            },
        });
    }
}