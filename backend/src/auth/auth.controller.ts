import { Controller, Get, Req, UseGuards, Res } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Response, Request } from 'express';

@Controller('auth')
export class AuthController {
    @Get('github')
    @UseGuards(AuthGuard('github'))
    async githubLogin() {
    }

    @Get('github/callback')
    @UseGuards(AuthGuard('github'))
    async githubLoginCallback(@Req() req: Request, @Res() res: Response) {
        const user = req.user;
        return res.json(user);
    }
}