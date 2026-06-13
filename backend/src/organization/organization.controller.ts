import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { OrganizationService } from './organization.service';
import { CreateOrganizationDTO } from 'src/dto/create-organization.dto';

@Controller('organizations')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}
  @Post()
  @UseGuards(JwtAuthGuard)
  createOrganization(@Req() req, @Body() dto: CreateOrganizationDTO) {
    return this.organizationService.createOrganization(req.user.userId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  getMyOrganizations(@Req() req) {
    return this.organizationService.getMyOrganizations(req.user.userId);
  }
}
