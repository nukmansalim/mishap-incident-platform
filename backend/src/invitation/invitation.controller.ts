import {
  Body,
  Controller,
  Param,
  Post,
  UseGuards,
  Request,
  Get,
  HttpCode,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InvitationService } from './invitation.service';
import { CreateInvitationDto } from 'src/dto/create-invitation.dto';
import { OrganizationRole, User } from 'generated/prisma/client';
import { CurrentUser } from 'src/decorators/current-user';
import { OrgRoles } from 'src/decorators/org-role';
import { OrgRoleGuard } from 'src/auth/guards/org-roles.guard';

@Controller('organizations/:orgId/invitations')
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) { }

  @Post()
  @UseGuards(JwtAuthGuard, OrgRoleGuard)
  @OrgRoles('owner', 'manager')
  async create(
    @Param('orgId') orgId: string,
    @Body() body: CreateInvitationDto,
    @CurrentUser() user: User
  ) {
    const userId = user.id

    const invitation = await this.invitationService.createInvitationForOrg(
      orgId,
      userId,
      body.email,
      OrganizationRole.member,
    );
    return {
      id: invitation.id,
      email: invitation.email,
      organizationId: invitation.organizationId,
      invitedById: invitation.invitedById,
      status: invitation.status,
      expiresAt: invitation.expiresAt,
      createdAt: invitation.createdAt,
      token: invitation.token,
    };
  }
  @Get(':token')
  @HttpCode(200)
  validateToken(@Param('token') token: string) {
    return this.invitationService.validateToken(token)
  }
  @Post(':token/accept')
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  acceptInvitation(@Param('token') token: string, @CurrentUser() user: User) {
    return this.invitationService.acceptInvitation(token, user);
  }
}
