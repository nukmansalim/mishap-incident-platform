import {
  Body,
  Controller,
  Param,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InvitationService } from './invitation.service';
import { CreateInvitationDto } from 'src/dto/create-invitation.dto';

@Controller('organizations/:orgId/invitations')
@UseGuards(JwtAuthGuard)
export class InvitationController {
  constructor(private readonly invitationService: InvitationService) {}

  @Post()
  async create(
    @Param('orgId') orgId: string,
    @Body() body: CreateInvitationDto,
    @Request() req,
  ) {
    const userId = req.user.id;

    const invitation = await this.invitationService.createInvitationForOrg(
      orgId,
      userId,
      body.email,
      body.role ?? 'member',
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
}
