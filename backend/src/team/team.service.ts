import {
  NotFoundException,
  ConflictException,
  Injectable,
} from '@nestjs/common';
import { TeamRepository } from './team.repository';
import {
  AddTeamMemberDto,
  CreateTeamDto,
  UpdateTeamDto,
  UpdateTeamMemberRoleDto,
} from './dto';
import { OrganizationMembershipService } from '../organization/organization-membership.service';
@Injectable()
export class TeamService {
  constructor(
    private readonly teamRepository: TeamRepository,
    private MembershipService: OrganizationMembershipService,
  ) {}

  private async ensureTeamInOrg(teamId: string, orgId: string) {
    const team = await this.teamRepository.findByIdAndOrg(teamId, orgId);

    if (!team) {
      throw new NotFoundException('Team not found in this organization');
    }

    return team;
  }

  async createTeam(orgId: string, dto: CreateTeamDto) {
    return this.teamRepository.createTeam(orgId, dto);
  }

  async getTeamsbyOrg(orgId: string) {
    return this.teamRepository.findAllByOrg(orgId);
  }

  async getTeamDetails(teamId: string, orgId: string) {
    return this.ensureTeamInOrg(teamId, orgId);
  }

  async updateTeam(teamId: string, orgId: string, dto: UpdateTeamDto) {
    await this.ensureTeamInOrg(teamId, orgId);
    return this.teamRepository.updateTeam(teamId, dto);
  }

  async deleteTeam(teamId: string, orgId: string) {
    await this.ensureTeamInOrg(teamId, orgId);
    return this.teamRepository.deleteTeam(teamId);
  }

  async addMemberIntoTeam(
    teamId: string,
    orgId: string,
    dto: AddTeamMemberDto,
  ) {
    await this.MembershipService.ensureUserIsMemberOfOrg(dto.userId, orgId);
    await this.ensureTeamInOrg(teamId, orgId);

    const isTargetTeamMember = await this.teamRepository.findMember(
      teamId,
      dto.userId,
    );

    if (isTargetTeamMember) {
      throw new ConflictException('User is already a member of this team');
    }

    return this.teamRepository.addMember(teamId, dto.userId, dto.role);
  }
  async getMembers(teamId: string, orgId: string) {
    await this.ensureTeamInOrg(teamId, orgId);
    return this.teamRepository.getMembers(teamId);
  }
  async updateMemberRole(
    orgId: string,
    teamId: string,
    targetUserId: string,
    dto: UpdateTeamMemberRoleDto,
  ) {
    await this.MembershipService.ensureUserIsMemberOfOrg(targetUserId, orgId);
    await this.ensureTeamInOrg(teamId, orgId);

    const isTargetTeamMember = await this.teamRepository.findMember(
      teamId,
      targetUserId,
    );

    if (!isTargetTeamMember) {
      throw new NotFoundException('Target user is not a member of this team');
    }
    return this.teamRepository.updateMemberRole(teamId, targetUserId, dto.role);
  }
  async removeMemberFromTeam(
    orgId: string,
    teamId: string,
    targetUserId: string,
  ) {
    await this.MembershipService.ensureUserIsMemberOfOrg(targetUserId, orgId);
    await this.ensureTeamInOrg(teamId, orgId);

    const isTargetTeamMember = await this.teamRepository.findMember(
      teamId,
      targetUserId,
    );

    if (!isTargetTeamMember) {
      throw new NotFoundException('Team member is not a part of this team');
    }
    return this.teamRepository.removeMember(teamId, targetUserId);
  }
}
