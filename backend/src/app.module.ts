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
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    OrganizationModule,
    InvitationModule,
    TeamModule,
    ClientModule,
    RouterModule.register([
      { path: 'organization', module: OrganizationModule }

    ])
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
