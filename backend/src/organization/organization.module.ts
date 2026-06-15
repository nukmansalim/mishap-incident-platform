import { Module } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { OrganizationController } from './organization.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { OrganizationRepository } from './organization.repository';

@Module({
  imports: [PrismaModule],
  providers: [OrganizationService, OrganizationRepository],
  controllers: [OrganizationController],
  exports: [OrganizationRepository],
})
export class OrganizationModule { }
