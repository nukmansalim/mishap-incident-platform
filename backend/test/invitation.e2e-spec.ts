import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';
describe('Invitation Flow (e2e)', () => {
    let app: INestApplication;
    let prisma: PrismaService;

    // State penyimpan data antar pengujian
    let tokenA: string; // JWT Akun A (Owner)
    let tokenB: string; // JWT Akun B (Invitee)
    let tokenC: string; // JWT Akun C (Rogue)
    let orgId: string;
    let invitationToken: string;

    const emailA = 'owner@test.local';
    const emailB = 'invitee@test.local';
    const emailC = 'rogue@test.local';

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        prisma = app.get(PrismaService);
        await app.init();
    });

    afterAll(async () => {
        // Cleanup database secara berurutan menghindari error relasi (Foreign Key constraint)
        await prisma.invitation.deleteMany();
        await prisma.organizationMember.deleteMany();
        await prisma.organization.deleteMany();
        await prisma.user.deleteMany();

        await app.close();
    });

    describe('1. Persiapan Akun & Organisasi', () => {
        it('should register 3 accounts via local strategy', async () => {
            // Catatan: Sesuaikan endpoint ini dengan local strategy di kodemu
            const reqA = await request(app.getHttpServer())
                .post('/auth/register')
                .send({ name: 'owner A', email: emailA, password: 'owner123' })
                .expect(201);
            tokenA = reqA.body.accessToken;

            const reqB = await request(app.getHttpServer())
                .post('/auth/register')
                .send({ name: 'invitee B', email: emailB, password: 'invitee123' })
                .expect(201);
            tokenB = reqB.body.accessToken;

            const reqC = await request(app.getHttpServer())
                .post('/auth/register')
                .send({ name: 'Rogue C', email: emailC, password: 'rogue123' })
                .expect(201);
            tokenC = reqC.body.accessToken;

            expect(tokenA).toBeDefined();
            expect(tokenB).toBeDefined();
            expect(tokenC).toBeDefined();
        });

        it('should create an organization for User A', async () => {
            const response = await request(app.getHttpServer())
                .post('/organizations')
                .set('Authorization', `Bearer ${tokenA}`)
                .send({ name: 'Mishap Corp' })
                .expect(201);
            orgId = response.body.organization.id;
            expect(orgId).toBeDefined();
        });
    });

    describe('2. Core Invitation Flow & Edge Cases', () => {
        it('User A should be able to invite User B', async () => {
            const response = await request(app.getHttpServer())
                .post(`/organizations/${orgId}/invitations`)
                .set('Authorization', `Bearer ${tokenA}`)
                .send({ email: emailB, role: 'member' })
                .expect(201);

            invitationToken = response.body.token;

            expect(response.body.email).toBe(emailB);
            expect(response.body.status).toBe('PENDING');
            expect(invitationToken).toBeDefined();
        });

        it('Public endpoint should validate the invitation token', async () => {
            const response = await request(app.getHttpServer())
                .get(`/organizations/${orgId}/invitations/${invitationToken}`)
                .expect(200);

            expect(response.body.email).toBe(emailB);
            expect(response.body.organizationId).toBe(orgId);
            expect(response.body.status).toBe('PENDING');
        });

        it('User C (Rogue) should NOT be able to accept User B invitation (Mismatched Email Test)', async () => {
            await request(app.getHttpServer())
                .post(`/organizations/${orgId}/invitations/${invitationToken}/accept`)
                .set('Authorization', `Bearer ${tokenC}`) // Memakai JWT milik C
                .expect(403);
        });

        it('User B should successfully accept their own invitation', async () => {
            await request(app.getHttpServer())
                .post(`/organizations/${orgId}/invitations/${invitationToken}/accept`)
                .set('Authorization', `Bearer ${tokenB}`) // Memakai JWT milik B
                .expect(200); // Atau 200, sesuaikan dengan kembalian controller kamu

            // Verifikasi status invitation di database berubah jadi ACCEPTED
            const dbInvite = await prisma.invitation.findUnique({
                where: { token: invitationToken }
            });
            expect(dbInvite.status).toBe('ACCEPTED');
            expect(dbInvite.acceptedAt).not.toBeNull();
        });

        it('User B should NOT be able to accept the same token twice (Double Accept Test)', async () => {
            await request(app.getHttpServer())
                .post(`/organizations/${orgId}/invitations/${invitationToken}/accept`)
                .set('Authorization', `Bearer ${tokenB}`)
                // Asumsi jika token yang sudah dipakai akan mereturn 409 atau 410, sesuaikan dengan logikamu
                .expect(410);
        });

        it('Public endpoint should reject already accepted token', async () => {
            await request(app.getHttpServer())
                .get(`/organizations/${orgId}/invitations/${invitationToken}`)
                .expect(410); // Menyesuaikan spek: mereturn error (contoh 410 Gone) jika expired/accepted
        });
    });

    describe('3. Expired Token Handling', () => {
        it('Should reject an expired invitation token', async () => {
            // 1. User A mengundang User C (Rogue) kali ini untuk tes expired
            const inviteRes = await request(app.getHttpServer())
                .post(`/organizations/${orgId}/invitations`)
                .set('Authorization', `Bearer ${tokenA}`)
                .send({ email: emailC, role: 'viewer' })
                .expect(201);

            const expiredToken = inviteRes.body.token;

            // 2. Manipulasi database agar token kadaluarsa 1 hari yang lalu
            const pastDate = new Date();
            pastDate.setDate(pastDate.getDate() - 1);

            await prisma.invitation.update({
                where: { token: expiredToken },
                data: { expiresAt: pastDate },
            });

            // 3. User C mencoba Accept token yang sudah dimanipulasi
            await request(app.getHttpServer())
                .post(`/organizations/${orgId}/invitations/${expiredToken}/accept`)
                .set('Authorization', `Bearer ${tokenC}`)
                .expect(410); // Asumsi mereturn 410 Gone untuk expired token
        });
    });
});