import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class AuthService {
    constructor(private prisma: PrismaService,
        private jwtService: JwtService
    ) { }

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
    async generateAccessToken(user: { id: string }) {
        const payload = { sub: user.id }
        return this.jwtService.sign(payload)
    }
}