import { Module } from '@nestjs/common';
import { TeamService } from './team.service';
import { TeamController } from './team.controller';
import { TeamRepository } from './team.repository';
import { OrganizationModule } from 'src/organization/organization.module';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule, OrganizationModule],
  providers: [TeamService, TeamRepository],
  controllers: [TeamController]
})
export class TeamModule { }
