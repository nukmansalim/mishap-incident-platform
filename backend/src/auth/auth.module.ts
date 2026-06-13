import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { GithubStrategy } from './github.strategy';
import { PrismaModule } from 'src/prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [PassportModule.register({}),
  JwtModule.register({
    secret: process.env.JWT_SECRET,
    signOptions: { expiresIn: '15m' },
  }),
    PrismaModule],
  controllers: [AuthController],
  providers: [AuthService,
    JwtStrategy,
    GithubStrategy]
})
export class AuthModule { }
