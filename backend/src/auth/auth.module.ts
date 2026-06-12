import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { SessionService } from './session.service';
import { PasswordService } from './password.service';
import { PassportModule } from '@nestjs/passport';
import { GithubStrategy } from './github.strategy';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PassportModule, AuthModule, PrismaModule],
  controllers: [AuthController],
  providers: [AuthService, SessionService, PasswordService, GithubStrategy]
})
export class AuthModule { }
