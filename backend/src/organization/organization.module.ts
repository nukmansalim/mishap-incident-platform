import { Module } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { OrganizationController } from './organization.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { OrganizationRepository } from './organization.repository';
import { OrganizationMembershipService } from './organization-membership.service';

@Module({
  imports: [PrismaModule],
  providers: [
    OrganizationService,
    OrganizationRepository,
    OrganizationMembershipService,
  ],
  controllers: [OrganizationController],
  exports: [OrganizationRepository, OrganizationMembershipService],
})
export class OrganizationModule {}
