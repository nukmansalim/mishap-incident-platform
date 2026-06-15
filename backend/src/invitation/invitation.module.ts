import { Module } from '@nestjs/common';
import { InvitationController } from './invitation.controller';
import { InvitationService } from './invitation.service';
import { InvitationRepository } from './invitation.repository';
import { PrismaModule } from '../prisma/prisma.module';
import { OrganizationModule } from 'src/organization/organization.module';

@Module({
  imports: [PrismaModule, OrganizationModule],
  controllers: [InvitationController],
  providers: [InvitationService, InvitationRepository],
  exports: [InvitationService, InvitationRepository],
})
export class InvitationModule { }
