import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Get('github')
    @UseGuards(AuthGuard('github'))
    async githubLogin() {

    }

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
    @Get('me')
    @UseGuards(JwtAuthGuard)
    getMe(@Req() req) {
        return {
            authenticated: true,
            user: req.user,
        };
    }
}