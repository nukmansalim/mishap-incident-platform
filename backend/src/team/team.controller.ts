import { Controller, Post, Get, Patch, Delete, Param, UseGuards, ParseUUIDPipe, Body } from '@nestjs/common';
import { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';
import { CurrentUser, OrgRoles } from 'src/common/decorators';
import { AddTeamMemberDto, CreateTeamDto, UpdateTeamDto, UpdateTeamMemberRoleDto } from './dto';
import { JwtAuthGuard, OrgRoleGuard } from 'src/common/guards';
import { TeamService } from './team.service';

@Controller()
@UseGuards(JwtAuthGuard)
export class TeamController {
    constructor(private teamService: TeamService) { }
    @Post()
    @UseGuards(OrgRoleGuard)
    @OrgRoles('owner', 'manager')
    async createTeam(
        @Param('orgId', new ParseUUIDPipe()) orgId: string,
        @Body() dto: CreateTeamDto) {
        return this.teamService.createTeam(orgId, dto)

    }

    @Get()
    @UseGuards(OrgRoleGuard)
    @OrgRoles('owner', 'manager', 'member')
    async findTeamsByOrg(
        @Param('orgId', new ParseUUIDPipe()) orgId: string) {
        return this.teamService.getTeamsbyOrg(orgId);
    }

    @Get(':teamId')
    @UseGuards(OrgRoleGuard)
    @OrgRoles('owner', 'manager', 'member')
    async getTeamDetails(
        @Param('teamId', new ParseUUIDPipe()) teamId: string,
        @Param('orgId', new ParseUUIDPipe()) orgId: string
    ) {
        return this.teamService.getTeamDetails(teamId, orgId);
    }

    @Patch(':teamId')
    @UseGuards(OrgRoleGuard)
    @OrgRoles('owner', 'manager')
    async updateTeam(
        @Param('teamId', new ParseUUIDPipe()) teamId: string,
        @Param('orgId', new ParseUUIDPipe()) orgId: string,
        @Body() data: UpdateTeamDto) {
        return this.teamService.updateTeam(teamId, orgId, data);
    }

    @Delete(':teamId')
    @UseGuards(OrgRoleGuard)
    @OrgRoles('owner', 'manager')
    async deleteTeam(
        @Param('teamId', new ParseUUIDPipe()) teamId: string,
        @Param('orgId', new ParseUUIDPipe()) orgId: string) {
        return this.teamService.deleteTeam(teamId, orgId);
    }

    @Post(':teamId/members')
    @UseGuards(OrgRoleGuard)
    @OrgRoles('owner', 'manager')
    async addMemberIntoTeam(
        @Param('teamId', new ParseUUIDPipe()) teamId: string,
        @Param('orgId', new ParseUUIDPipe()) orgId: string,
        @Body() data: AddTeamMemberDto) {
        return this.teamService.addMemberIntoTeam(teamId, orgId, data);
    }

    @Get(':teamId/members')
    @UseGuards(OrgRoleGuard)
    @OrgRoles('owner', 'manager', 'member')
    async getMembers(
        @Param('teamId', new ParseUUIDPipe()) teamId: string,
        @Param('orgId', new ParseUUIDPipe()) orgId: string) {
        return this.teamService.getMembers(teamId, orgId);
    }

    @Patch(':teamId/members/:userId')
    @UseGuards(OrgRoleGuard)
    @OrgRoles('owner', 'manager')
    async updateMemberRole(
        @Param('orgId', new ParseUUIDPipe()) orgId: string,
        @Param('teamId', new ParseUUIDPipe()) teamId: string,
        @Param('userId', new ParseUUIDPipe()) targetUserId: string,
        @Body() dto: UpdateTeamMemberRoleDto) {
        return this.teamService.updateMemberRole(orgId, teamId, targetUserId, dto);
    }

    @Delete(':teamId/members/:userId')
    @UseGuards(OrgRoleGuard)
    @OrgRoles('owner', 'manager')
    async removeMemberFromTeam(
        @Param('orgId', new ParseUUIDPipe()) orgId: string,
        @Param('teamId', new ParseUUIDPipe()) teamId: string,
        @Param('userId', new ParseUUIDPipe()) targetUserId: string,
    ) {
        return this.teamService.removeMemberFromTeam(orgId, teamId, targetUserId);
    }
}
