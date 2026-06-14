import { Body, Controller, Get, Post, ParseUUIDPipe, UseGuards, Param } from '@nestjs/common';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { OrganizationService } from './organization.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { CurrentUser } from 'src/common/decorators/current-user';
import { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';

@Controller('organizations')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) { }
  @Post()
  @UseGuards(JwtAuthGuard)
  createOrganization(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateOrganizationDto) {
    return this.organizationService.createOrganization(user.id, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  getMyOrganizations(@CurrentUser() user: AuthenticatedUser) {
    return this.organizationService.getMyOrganizations(user.id);
  }

  @Get(':orgId/members')
  @UseGuards(JwtAuthGuard)
  getCurrentOrganizationMember(@CurrentUser() user: AuthenticatedUser,
    @Param('orgId', new ParseUUIDPipe()) orgId: string) {
    return this.organizationService.getOrganizationMembers(orgId, user)
  }
}
