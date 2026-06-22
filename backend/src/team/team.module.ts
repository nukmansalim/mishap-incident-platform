import { Module } from '@nestjs/common';
import { TeamService } from './team.service';
import { TeamController } from './team.controller';
import { TeamRepository } from './team.repository';
import { OrganizationModule } from '../organization/organization.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, OrganizationModule],
  providers: [TeamService, TeamRepository],
  controllers: [TeamController],
})
export class TeamModule {}
