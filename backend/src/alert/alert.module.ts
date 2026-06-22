import { OrganizationModule } from '@/organization/organization.module';
import { PrismaModule } from '@/prisma/prisma.module';
import { TeamModule } from '@/team/team.module';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { alertQueueConfig } from './queue/queue.config';
@Module({
  imports: [
    PrismaModule,
    TeamModule,
    OrganizationModule,
    BullModule.registerQueue(alertQueueConfig),
  ],
  providers: [],
  controllers: [],
})
export class AlertModule {}
