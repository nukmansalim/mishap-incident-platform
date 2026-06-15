import { ForbiddenException, NotFoundException, ConflictException, Injectable } from '@nestjs/common';
import { TeamRepository } from './team.repository';
import { CreateTeamDto } from './dto/create-team.dto';
import { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';
import { OrganizationRepository } from 'src/organization/organization.repository';
import { UpdateTeamDto } from './dto/update-team.dto';
import { AddTeamMemberDto } from './dto/add-team-member.dto';
import { UpdateTeamMemberRoleDto } from './dto/update-team-member-role.dto';

@Injectable()
export class TeamService {
    constructor(private readonly teamRepository: TeamRepository,
        private organizationRepository: OrganizationRepository) { }

    private async ensureOrgMembership(orgId: string, userId: string) {
        const membership = await this.organizationRepository.findMembership(orgId, userId)
        if (!membership) {
            throw new ForbiddenException('You are not member of this organization')
        } else {
            return membership;
        }
    }
    private async ensureTeamInOrg(teamId: string, orgId: string) {
        const team = await this.teamRepository.findByIdAndOrg(teamId, orgId);

        if (!team) {
            throw new NotFoundException('Team not found in this organization');
        }

        return team;
    }

    async createTeam(user: AuthenticatedUser, orgId: string, dto: CreateTeamDto) {
        await this.ensureOrgMembership(orgId, user.id)
        return this.teamRepository.createTeam(orgId, dto)
    }

    async getTeamsbyOrg(user: AuthenticatedUser, orgId: string) {
        await this.ensureOrgMembership(orgId, user.id)
        return this.teamRepository.findAllByOrg(orgId)
    }

    async getTeamDetails(user: AuthenticatedUser, teamId: string, orgId: string) {
        await this.ensureOrgMembership(orgId, user.id)
        return this.ensureTeamInOrg(teamId, orgId);

    }

    async updateTeam(user: AuthenticatedUser, teamId: string, orgId: string, dto: UpdateTeamDto) {
        await this.ensureOrgMembership(orgId, user.id)
        await this.ensureTeamInOrg(teamId, orgId);
        return this.teamRepository.updateTeam(teamId, dto)
    }

    async deleteTeam(user: AuthenticatedUser, teamId: string, orgId: string) {
        await this.ensureOrgMembership(orgId, user.id)
        await this.ensureTeamInOrg(teamId, orgId);
        return this.teamRepository.deleteTeam(teamId)
    }

    async addMemberIntoTeam(
        actor: AuthenticatedUser,
        teamId: string,
        orgId: string,
        dto: AddTeamMemberDto,
    ) {
        await this.ensureOrgMembership(orgId, actor.id);
        await this.ensureOrgMembership(orgId, dto.userId);
        await this.ensureTeamInOrg(teamId, orgId);

        const isTargetTeamMember = await this.teamRepository.findMember(teamId, dto.userId);

        if (isTargetTeamMember) {
            throw new ConflictException('User is already a member of this team');
        }

        return this.teamRepository.addMember(teamId, dto.userId, dto.role);
    }
    async getMembers(user: AuthenticatedUser, teamId: string, orgId: string) {
        await this.ensureOrgMembership(orgId, user.id)
        await this.ensureTeamInOrg(teamId, orgId);
        return this.teamRepository.getMembers(teamId)
    }
    async updateMemberRole(actor: AuthenticatedUser,
        orgId: string,
        teamId: string,
        targetUserId: string,
        dto: UpdateTeamMemberRoleDto) {
        await this.ensureOrgMembership(orgId, actor.id);
        await this.ensureOrgMembership(orgId, targetUserId);
        await this.ensureTeamInOrg(teamId, orgId);

        const isTargetTeamMember = await this.teamRepository.findMember(teamId, targetUserId);

        if (!isTargetTeamMember) {
            throw new NotFoundException('Target user is not a member of this team');
        }
        return this.teamRepository.updateMemberRole(teamId, targetUserId, dto.role)
    }
    async removeMemberFromTeam(actor: AuthenticatedUser,
        orgId: string,
        teamId: string,
        targetUserId: string) {
        await this.ensureOrgMembership(orgId, actor.id);
        await this.ensureOrgMembership(orgId, targetUserId);
        await this.ensureTeamInOrg(teamId, orgId);

        const isTargetTeamMember = await this.teamRepository.findMember(teamId, targetUserId);

        if (!isTargetTeamMember) {
            throw new NotFoundException('Team member is not a part of this team');
        }
        return this.teamRepository.removeMember(teamId, targetUserId)
    }

}
