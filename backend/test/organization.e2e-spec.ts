import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthGuard } from '@nestjs/passport';

describe('Organization Flow (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;

    // State to store data between tests
    let tokenA: string; // JWT for Account A (GitHub)
    let tokenB: string; // JWT for Account B (Local)
    let orgIdA: string;
    let orgIdB: string;

    const emailA = 'usera@github.local';
    const emailB = 'userb@local.local';

    let mockGithubUser: any;

    beforeAll(async () => {
        // Override AuthGuard('github') to bypass GitHub's redirection/consent screen
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
        .overrideGuard(AuthGuard('github'))
        .useValue({
            canActivate: (context) => {
                const req = context.switchToHttp().getRequest();
                // Inject the mock user created in the DB into the request
                req.user = mockGithubUser;
                return true;
            }
        })
        .compile();

        app = moduleFixture.createNestApplication();
        prisma = app.get(PrismaService);
        await app.init();

        // Clear existing database records before tests start
        await prisma.invitation.deleteMany();
        await prisma.organizationMember.deleteMany();
        await prisma.organization.deleteMany();
        await prisma.user.deleteMany();

        // Pre-create the GitHub user in the DB
        mockGithubUser = await prisma.user.create({
            data: {
                email: emailA,
                name: 'User A Github',
                githubId: 'github-123456',
            }
        });
    });

    afterAll(async () => {
        // Cleanup database
        await prisma.invitation.deleteMany();
        await prisma.organizationMember.deleteMany();
        await prisma.organization.deleteMany();
        await prisma.user.deleteMany();

        await app.close();
    });

    describe('1. User A (GitHub Auth Flow & Organization Creation)', () => {
        it('1.a. should login via github callback to get accessToken', async () => {
            const response = await request(app.getHttpServer())
                .get('/auth/github/callback')
                .expect(200);

            tokenA = response.body.accessToken;
            expect(tokenA).toBeDefined();
            expect(response.body.user.email).toBe(emailA);
        });

        it('1.b. user A should create organization', async () => {
            const response = await request(app.getHttpServer())
                .post('/organizations')
                .set('Authorization', `Bearer ${tokenA}`)
                .send({ name: 'Github Org A' })
                .expect(201);

            orgIdA = response.body.organization.id;
            expect(orgIdA).toBeDefined();
            expect(response.body.organization.name).toBe('Github Org A');

            // Verify the owner membership in database
            const membership = await prisma.organizationMember.findFirst({
                where: {
                    organizationId: orgIdA,
                    userId: mockGithubUser.id
                }
            });
            expect(membership).toBeDefined();
            expect(membership.role).toBe('owner');
        });
    });

    describe('2. User B (Local Auth Flow & Organization Creation)', () => {
        it('2.a. should register and login user B via local strategy', async () => {
            // Register User B local account
            await request(app.getHttpServer())
                .post('/auth/register')
                .send({ name: 'User B Local', email: emailB, password: 'password123' })
                .expect(201);

            // Log in User B to fetch JWT
            const response = await request(app.getHttpServer())
                .post('/auth/login')
                .send({ email: emailB, password: 'password123' })
                .expect(201);

            tokenB = response.body.accessToken;
            expect(tokenB).toBeDefined();
            expect(response.body.user.email).toBe(emailB);
        });

        it('2.b. user B should create organization', async () => {
            const response = await request(app.getHttpServer())
                .post('/organizations')
                .set('Authorization', `Bearer ${tokenB}`)
                .send({ name: 'Local Org B' })
                .expect(201);

            orgIdB = response.body.organization.id;
            expect(orgIdB).toBeDefined();
            expect(response.body.organization.name).toBe('Local Org B');

            const dbUserB = await prisma.user.findUnique({
                where: { email: emailB }
            });

            // Verify the owner membership in database
            const membership = await prisma.organizationMember.findFirst({
                where: {
                    organizationId: orgIdB,
                    userId: dbUserB.id
                }
            });
            expect(membership).toBeDefined();
            expect(membership.role).toBe('owner');
        });
    });
});
