import { Module } from '@nestjs/common';
import { ClientService } from './client.service';
import { ClientController } from './client.controller';
import { ClientRepository } from './client.repository';
import { OrganizationModule } from '../organization/organization.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [OrganizationModule, PrismaModule],
  providers: [ClientService, ClientRepository],
  controllers: [ClientController],
})
export class ClientModule {}
