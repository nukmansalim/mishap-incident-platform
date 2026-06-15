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

@Controller('organizations/:orgId/teams')
@UseGuards(JwtAuthGuard)
export class TeamController {
    @Post()
    @UseGuards(OrgRoleGuard)
    @OrgRoles('owner', 'manager')
    async createTeam(@CurrentUser() user: AuthenticatedUser,
        @Param('orgId', new ParseUUIDPipe()) orgId: string,
        @Body() data: CreateTeamDto) {

    }

    @Get()
    async findTeamsByOrg(@CurrentUser() user: AuthenticatedUser,
        @Param('orgId', new ParseUUIDPipe()) orgId: string) {
    }

    @Get(':teamId')
    async getTeamDetails(@CurrentUser() user: AuthenticatedUser,
        @Param('teamId', new ParseUUIDPipe()) teamId: string,
        @Param('orgId', new ParseUUIDPipe()) orgId: string
    ) {

    }
    @Patch(':teamId')
    @UseGuards(OrgRoleGuard)
    @OrgRoles('owner', 'manager')
    async updateTeam(@CurrentUser() user: AuthenticatedUser,
        @Param('teamId', new ParseUUIDPipe()) teamId: string,
        @Param('orgId', new ParseUUIDPipe()) orgId: string,
        @Body() data: UpdateTeamDto) {

    }
    @Delete(':teamId')
    @UseGuards(OrgRoleGuard)
    @OrgRoles('owner', 'manager')
    async deleteTeam(@CurrentUser() user: AuthenticatedUser,
        @Param('teamId', new ParseUUIDPipe()) teamId: string,
        @Param('orgId', new ParseUUIDPipe()) orgId: string) {

    }
    @Post(':teamId/members')
    @UseGuards(OrgRoleGuard)
    @OrgRoles('owner', 'manager')
    async addMemberIntoTeam(@CurrentUser() actor: AuthenticatedUser,
        @Param('teamId', new ParseUUIDPipe()) teamId: string,
        @Param('orgId', new ParseUUIDPipe()) orgId: string,
        @Body() data: AddTeamMemberDto) {

    }
    @Get(':teamId/members')
    async getMembers(@CurrentUser() actor: AuthenticatedUser,
        @Param('teamId', new ParseUUIDPipe()) teamId: string,
        @Param('orgId', new ParseUUIDPipe()) orgId: string) {

    }
    @Patch(':teamId/members/:userId')
    @UseGuards(OrgRoleGuard)
    @OrgRoles('owner', 'manager')
    async updateMemberRole(@CurrentUser() actor: AuthenticatedUser,
        @Param('orgId', new ParseUUIDPipe()) orgId: string,
        @Param('teamId', new ParseUUIDPipe()) teamId: string,
        @Param('userId', new ParseUUIDPipe()) targetUserId: string,
        @Body() dto: UpdateTeamMemberRoleDto) {

    }
    @Delete(':teamId/members/:userId')
    @UseGuards(OrgRoleGuard)
    @OrgRoles('owner', 'manager')
    async removeMemberFromTeam(@CurrentUser() actor: AuthenticatedUser,
        @Param('orgId', new ParseUUIDPipe()) orgId: string,
        @Param('teamId', new ParseUUIDPipe()) teamId: string,
        @Param('userId', new ParseUUIDPipe()) targetUserId: string,
    ) {

    }
}
