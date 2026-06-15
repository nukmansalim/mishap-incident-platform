import { Module } from '@nestjs/common';
import { TeamService } from './team.service';
import { TeamController } from './team.controller';
import { TeamRepository } from './team.repository';

@Module({
  providers: [TeamService, TeamRepository],
  controllers: [TeamController]
})
export class TeamModule { }
