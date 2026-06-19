import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { OrganizationModule } from './organization/organization.module';
import { InvitationModule } from './invitation/invitation.module';
import { TeamModule } from './team/team.module';
import { ClientModule } from './client/client.module';
import { RouterModule } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { MonitorModule } from './monitor/monitor.module';
import { BullModule } from '@nestjs/bullmq';
@Module({
  imports: [
    BullModule.forRoot({
      connection: {
        host: 'localhost',
        port: 6379
      }
    }),
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    OrganizationModule,
    InvitationModule,
    TeamModule, MonitorModule,
    ClientModule,
    RouterModule.register([
      { path: 'organization', module: OrganizationModule }

    ])
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
