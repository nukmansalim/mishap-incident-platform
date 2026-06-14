import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Post, Body } from '@nestjs/common';
import { LocalAuthGuard } from '../common/guards/local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Get('github')
  @UseGuards(AuthGuard('github'))
  async githubLogin() { }

  @Get('github/callback')
  @UseGuards(AuthGuard('github'))
  async githubCallback(@Req() req, @Res() res) {
    const user = req.user;
    const accessToken = await this.authService.generateAccessToken(user);

    return res.json({
      accessToken,
      user,
    });
  }

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto)
  }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  async login(@Body() dto: LoginDto) {

    return this.authService.login(dto)
  }
}
