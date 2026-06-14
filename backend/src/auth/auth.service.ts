import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt'
import { RegisterDto } from 'src/dto/register.dto';
import { loginDto } from 'src/dto/login.dto';
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) { }

  async register(dto: RegisterDto): Promise<any> {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email }
    })
    if (existing) {
      throw new BadRequestException('Email sudah Terdaftar')
    }

    const passwordHash = await bcrypt.hash(dto.password, 10)
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash: passwordHash
      }
    })

    const payload = { sub: user.id, email: user.email }
    const accessToken = this.jwtService.sign(payload)
    const { passwordHash: _, ...safeUser } = user

    return {
      user: safeUser, accessToken
    }
  }

  async validateUser(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (!user || !user.passwordHash) return null;

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return null;

    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  async login(user: loginDto) {
    let userId = user.id;
    if (!userId) {
      const dbUser = await this.prisma.user.findUnique({
        where: { email: user.email },
        select: { id: true }
      });
      if (!dbUser) {
        throw new Error('Kredensial Salah');
      }

      userId = dbUser.id;
    }

    const accessToken = await this.generateAccessToken({ ...user, id: userId });
    return {
      accessToken,
      user: {
        sub: userId,
        email: user.email,
        name: user.name,
      }
    };
  }

  async validateGithubUser(profile: any) {
    const githubId = profile.id;
    const email = profile.emails?.[0]?.value;

    if (!email) throw new Error('No email from GitHub');

    let user = await this.prisma.user.findUnique({
      where: { githubId },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          githubId,
          email,
          name: profile.username,
          avatarUrl: profile.photos?.[0]?.value,
        },
      });
    }

    return user;
  }
  async generateAccessToken(user: { id?: string; email: string; name?: string }) {
    const payload = {
      sub: user.id,
      email: user.email,
      name: user.name,
    };
    return this.jwtService.sign(payload);
  }
}
