import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';
import { config } from 'dotenv';
import { PrismaService } from 'src/prisma/prisma.service';

config(); // load .env

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
    constructor(private readonly prisma: PrismaService) {
        super({
            clientID: process.env.GITHUB_OAUTH_CLIENT_ID!,
            clientSecret: process.env.GITHUB_OAUTH_CLIENT_SECRET!,
            callbackURL: process.env.GITHUB_CALLBACK_URL!,
            scope: ['user:email'],
        });
    }

    async validate(
        accessToken: string,
        refreshToken: string,
        profile: Profile,
        done: Function,
    ) {
        const { id: githubId, username, emails, photos } = profile;
        const email = emails && emails.length ? emails[0].value : null;

        if (!email) return done(new Error('Email not available from GitHub'), null);

        // cek user di database
        let user = await this.prisma.user.findUnique({ where: { githubId } });

        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    name: username,
                    email,
                    githubId,
                    avatarUrl: photos && photos.length ? photos[0].value : null,
                },
            });
        }

        done(null, user);
    }
}