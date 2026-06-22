import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { OrganizationRole } from '../../generated/prisma/enums';
import { ClientService } from './client.service';
import { CreateClientDto, UpdateClientDto, ListClientsDto } from './dto';
import { JwtAuthGuard, OrgRoleGuard } from '../common/guards';
import { OrgRoles } from '../common/decorators/org-role';
import { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { CurrentUser } from '../common/decorators';

@Controller()
@UseGuards(JwtAuthGuard, OrgRoleGuard)
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post()
  @OrgRoles(OrganizationRole.owner, OrganizationRole.manager)
  async create(
    @Param('orgId') orgId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateClientDto,
  ) {
    return this.clientService.create(orgId, user.id, dto);
  }

  @Get()
  async findAll(@Param('orgId') orgId: string, @Query() query: ListClientsDto) {
    return this.clientService.findAll(orgId, query);
  }

  @Get(':clientId')
  async findById(
    @Param('orgId') orgId: string,
    @Param('clientId') clientId: string,
  ) {
    return this.clientService.findById(orgId, clientId);
  }

  @Patch(':clientId')
  @OrgRoles(OrganizationRole.owner, OrganizationRole.manager)
  async update(
    @Param('orgId') orgId: string,
    @Param('clientId') clientId: string,
    @Body() dto: UpdateClientDto,
  ) {
    return this.clientService.update(orgId, clientId, dto);
  }

  @Post(':clientId/archive')
  @OrgRoles(OrganizationRole.owner, OrganizationRole.manager)
  async archive(
    @Param('orgId') orgId: string,
    @Param('clientId') clientId: string,
  ) {
    return this.clientService.archive(orgId, clientId);
  }

  @Post(':clientId/restore')
  @OrgRoles(OrganizationRole.owner, OrganizationRole.manager)
  async restore(
    @Param('orgId') orgId: string,
    @Param('clientId') clientId: string,
  ) {
    return this.clientService.restore(orgId, clientId);
  }
}
