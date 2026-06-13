import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { OrganizationModule } from './organization/organization.module';
import { InvitationService } from './invitation/invitation.service';
import { InvitationController } from './invitation/invitation.controller';
import { InvitationModule } from './invitation/invitation.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    OrganizationModule,
    InvitationModule,
  ],
  controllers: [AppController, InvitationController],
  providers: [AppService, InvitationService],
})
export class AppModule {}
