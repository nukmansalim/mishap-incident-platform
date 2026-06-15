import { Controller, Post, Get, Patch, Delete, Param, UseGuards, ParseUUIDPipe, Body } from '@nestjs/common';
import { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';
import { CurrentUser } from 'src/common/decorators/current-user';
import { UpdateTeamDto } from './dto/update-team.dto';
import { UpdateTeamMemberRoleDto } from './dto/update-team-member-role.dto';
import { AddTeamMemberDto } from './dto/add-team-member.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { CreateTeamDto } from './dto/create-team.dto';
import { OrgRoleGuard } from 'src/common/guards/org-roles.guard';
import { OrgRoles } from 'src/common/decorators/org-role';
import { TeamService } from './team.service';

@Controller('organizations/:orgId/teams')
@UseGuards(JwtAuthGuard)
export class TeamController {
    constructor(private teamService: TeamService) { }
    @Post()
    @UseGuards(OrgRoleGuard)
    @OrgRoles('owner', 'manager')
    async createTeam(@CurrentUser() user: AuthenticatedUser,
        @Param('orgId', new ParseUUIDPipe()) orgId: string,
        @Body() dto: CreateTeamDto) {
        return this.teamService.createTeam(user, orgId, dto)

    }

    @Get()
    async findTeamsByOrg(@CurrentUser() user: AuthenticatedUser,
        @Param('orgId', new ParseUUIDPipe()) orgId: string) {
        return this.teamService.getTeamsbyOrg(user, orgId);
    }

    @Get(':teamId')
    async getTeamDetails(@CurrentUser() user: AuthenticatedUser,
        @Param('teamId', new ParseUUIDPipe()) teamId: string,
        @Param('orgId', new ParseUUIDPipe()) orgId: string
    ) {
        return this.teamService.getTeamDetails(user, teamId, orgId);
    }

    @Patch(':teamId')
    @UseGuards(OrgRoleGuard)
    @OrgRoles('owner', 'manager')
    async updateTeam(@CurrentUser() user: AuthenticatedUser,
        @Param('teamId', new ParseUUIDPipe()) teamId: string,
        @Param('orgId', new ParseUUIDPipe()) orgId: string,
        @Body() data: UpdateTeamDto) {
        return this.teamService.updateTeam(user, teamId, orgId, data);
    }

    @Delete(':teamId')
    @UseGuards(OrgRoleGuard)
    @OrgRoles('owner', 'manager')
    async deleteTeam(@CurrentUser() user: AuthenticatedUser,
        @Param('teamId', new ParseUUIDPipe()) teamId: string,
        @Param('orgId', new ParseUUIDPipe()) orgId: string) {
        return this.teamService.deleteTeam(user, teamId, orgId);
    }

    @Post(':teamId/members')
    @UseGuards(OrgRoleGuard)
    @OrgRoles('owner', 'manager')
    async addMemberIntoTeam(@CurrentUser() actor: AuthenticatedUser,
        @Param('teamId', new ParseUUIDPipe()) teamId: string,
        @Param('orgId', new ParseUUIDPipe()) orgId: string,
        @Body() data: AddTeamMemberDto) {
        return this.teamService.addMemberIntoTeam(actor, teamId, orgId, data);
    }

    @Get(':teamId/members')
    async getMembers(@CurrentUser() actor: AuthenticatedUser,
        @Param('teamId', new ParseUUIDPipe()) teamId: string,
        @Param('orgId', new ParseUUIDPipe()) orgId: string) {
        return this.teamService.getMembers(actor, teamId, orgId);
    }

    @Patch(':teamId/members/:userId')
    @UseGuards(OrgRoleGuard)
    @OrgRoles('owner', 'manager')
    async updateMemberRole(@CurrentUser() actor: AuthenticatedUser,
        @Param('orgId', new ParseUUIDPipe()) orgId: string,
        @Param('teamId', new ParseUUIDPipe()) teamId: string,
        @Param('userId', new ParseUUIDPipe()) targetUserId: string,
        @Body() dto: UpdateTeamMemberRoleDto) {
        return this.teamService.updateMemberRole(actor, orgId, teamId, targetUserId, dto);
    }

    @Delete(':teamId/members/:userId')
    @UseGuards(OrgRoleGuard)
    @OrgRoles('owner', 'manager')
    async removeMemberFromTeam(@CurrentUser() actor: AuthenticatedUser,
        @Param('orgId', new ParseUUIDPipe()) orgId: string,
        @Param('teamId', new ParseUUIDPipe()) teamId: string,
        @Param('userId', new ParseUUIDPipe()) targetUserId: string,
    ) {
        return this.teamService.removeMemberFromTeam(actor, orgId, teamId, targetUserId);
    }
}
