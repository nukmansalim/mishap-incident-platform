import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, Profile } from 'passport-github2';
import { config } from 'dotenv';

config(); // load .env

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
    constructor() {
        super({
            clientID: process.env.GITHUB_CLIENT_ID!,
            clientSecret: process.env.GITHUB_CLIENT_SECRET!,
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
        const { id, username, photos, emails } = profile;

        const user = {
            githubId: id,
            username,
            email: emails && emails.length ? emails[0].value : null,
            photo: photos && photos.length ? photos[0].value : null,
            accessToken,
        };

        done(null, user);
    }
}