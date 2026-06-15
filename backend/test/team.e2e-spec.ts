import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import { PrismaService } from 'src/prisma/prisma.service';

describe('Team E2E Flow', () => {
    let app: INestApplication;
    let prisma: PrismaService;

    // Shared state across tests
    let tokenA: string;
    let tokenB: string;
    let tokenC: string;

    let userAId: string;
    let userBId: string;
    let userCId: string;
    let userDId: string; // Dynamic target user who is in org but not in team

    let orgId1: string;
    let orgId2: string;

    let teamId1: string;
    let teamId2: string;
    let teamIdInactive: string;

    const emailA = 'usera_team@local.local';
    const emailB = 'userb_team@local.local';
    const emailC = 'userc_team@local.local';
    const emailD = 'userd_team@local.local';

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        prisma = app.get(PrismaService);
        await app.init();

        // Database cleanup in order of dependencies
        await prisma.teamMember.deleteMany();
        await prisma.team.deleteMany();
        await prisma.invitation.deleteMany();
        await prisma.organizationMember.deleteMany();
        await prisma.organization.deleteMany();
        await prisma.user.deleteMany();
    });

    afterAll(async () => {
        // Cleanup after all tests run
        await prisma.teamMember.deleteMany();
        await prisma.team.deleteMany();
        await prisma.invitation.deleteMany();
        await prisma.organizationMember.deleteMany();
        await prisma.organization.deleteMany();
        await prisma.user.deleteMany();

        await app.close();
    });

    // ==========================================
    // A. Setup & Auth
    // ==========================================

    it('Team E2E – A.1. Auth – Register user A (owner candidate)', async () => {
        const res = await request(app.getHttpServer())
            .post('/auth/register')
            .send({ name: 'User A', email: emailA, password: 'password123' })
            .expect(201);

        expect(res.body.user).toBeDefined();
        expect(res.body.user.id).toBeDefined();
        userAId = res.body.user.id;
    });

    it('Team E2E – A.2. Auth – Login user A', async () => {
        const res = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: emailA, password: 'password123' })
            .expect(201); // NestJS default POST status is 201

        tokenA = res.body.accessToken;
        expect(tokenA).toBeDefined();
    });

    it('Team E2E – A.3. Setup – Buat organization dan jadikan user A sebagai owner', async () => {
        const res = await request(app.getHttpServer())
            .post('/organizations')
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ name: 'Org A' })
            .expect(201);

        orgId1 = res.body.organization.id;
        expect(orgId1).toBeDefined();

        const membership = await prisma.organizationMember.findFirst({
            where: {
                organizationId: orgId1,
                userId: userAId,
            },
        });
        expect(membership).toBeDefined();
        expect(membership.role).toBe('owner');
    });

    it('Team E2E – A.4. Auth – Register user B (member candidate)', async () => {
        const res = await request(app.getHttpServer())
            .post('/auth/register')
            .send({ name: 'User B', email: emailB, password: 'password123' })
            .expect(201);

        expect(res.body.user).toBeDefined();
        expect(res.body.user.id).toBeDefined();
        userBId = res.body.user.id;
    });

    it('Team E2E – A.5. Auth – Login user B', async () => {
        const res = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: emailB, password: 'password123' })
            .expect(201);

        tokenB = res.body.accessToken;
        expect(tokenB).toBeDefined();
    });

    it('Team E2E – A.6. Setup – Jadikan user B member di org', async () => {
        // Direct database setup via Prisma since no invite/add endpoint is practical
        const membership = await prisma.organizationMember.create({
            data: {
                organizationId: orgId1,
                userId: userBId,
                role: 'member',
            },
        });
        expect(membership).toBeDefined();
        expect(membership.userId).toBe(userBId);
        expect(membership.organizationId).toBe(orgId1);
    });

    // Helper setup to register User C and create Org 2 for cross-tenant tests
    it('Team E2E – Setup – Register User C and Org 2', async () => {
        const resReg = await request(app.getHttpServer())
            .post('/auth/register')
            .send({ name: 'User C', email: emailC, password: 'password123' })
            .expect(201);
        userCId = resReg.body.user.id;

        const resLogin = await request(app.getHttpServer())
            .post('/auth/login')
            .send({ email: emailC, password: 'password123' })
            .expect(201);
        tokenC = resLogin.body.accessToken;

        const resOrg2 = await request(app.getHttpServer())
            .post('/organizations')
            .set('Authorization', `Bearer ${tokenC}`)
            .send({ name: 'Org C' })
            .expect(201);
        orgId2 = resOrg2.body.organization.id;

        expect(orgId2).toBeDefined();
    });

    // ==========================================
    // B. Team – Create / List / Detail / Update / Delete
    // ==========================================

    it('Team E2E – B.7. Create team – owner sebagai member org (happy path)', async () => {
        const res = await request(app.getHttpServer())
            .post(`/organizations/${orgId1}/teams`)
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ name: 'Team Alpha', description: 'Alpha Team Description' })
            .expect(201);

        teamId1 = res.body.id;
        expect(teamId1).toBeDefined();
        expect(res.body.organizationId).toBe(orgId1);
        expect(res.body.status).toBe('active');
    });

    it('Team E2E – B.8. Create team – user bukan member org (forbidden)', async () => {
        // User C is not a member of orgId1
        const res = await request(app.getHttpServer())
            .post(`/organizations/${orgId1}/teams`)
            .set('Authorization', `Bearer ${tokenC}`)
            .send({ name: 'Forbidden Team' })
            .expect(403);

        // OrgRoleGuard returns 'You are not a member of this organization'
        expect(res.body.message).toBe('You are not a member of this organization');
    });

    it('Team E2E – B.9. List teams – member org melihat hanya team active', async () => {
        // Create an inactive team in orgId1 via Prisma
        const inactiveTeam = await prisma.team.create({
            data: {
                organizationId: orgId1,
                name: 'Inactive Team',
                status: 'inactive',
            },
        });
        teamIdInactive = inactiveTeam.id;

        const res = await request(app.getHttpServer())
            .get(`/organizations/${orgId1}/teams`)
            .set('Authorization', `Bearer ${tokenA}`)
            .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
        const inactiveInList = res.body.find((t: any) => t.id === teamIdInactive);
        const activeInList = res.body.find((t: any) => t.id === teamId1);

        expect(activeInList).toBeDefined();
        expect(inactiveInList).toBeUndefined();
    });

    it('Team E2E – B.10. List teams – non-member org (forbidden)', async () => {
        await request(app.getHttpServer())
            .get(`/organizations/${orgId1}/teams`)
            .set('Authorization', `Bearer ${tokenC}`)
            .expect(403);
    });

    it('Team E2E – B.11. Get team details – team milik org dan user member org', async () => {
        const res = await request(app.getHttpServer())
            .get(`/organizations/${orgId1}/teams/${teamId1}`)
            .set('Authorization', `Bearer ${tokenA}`)
            .expect(200);

        expect(res.body.id).toBe(teamId1);
        expect(res.body.members).toBeDefined();
        expect(Array.isArray(res.body.members)).toBe(true);
    });

    it('Team E2E – B.12. Get team details – team bukan milik org (cross-tenant)', async () => {
        // First create a team in orgId2 (owned by C)
        const resOrg2Team = await request(app.getHttpServer())
            .post(`/organizations/${orgId2}/teams`)
            .set('Authorization', `Bearer ${tokenC}`)
            .send({ name: 'Team Org 2' })
            .expect(201);
        teamId2 = resOrg2Team.body.id;

        // User A requests teamId2 using orgId1
        const res = await request(app.getHttpServer())
            .get(`/organizations/${orgId1}/teams/${teamId2}`)
            .set('Authorization', `Bearer ${tokenA}`)
            .expect(404);

        expect(res.body.message).toBe('Team not found in this organization');
    });

    it('Team E2E – B.13. Update team – user member org, team milik org', async () => {
        await request(app.getHttpServer())
            .patch(`/organizations/${orgId1}/teams/${teamId1}`)
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ name: 'Updated Name' })
            .expect(200);

        const dbTeam = await prisma.team.findUnique({
            where: { id: teamId1 },
        });
        expect(dbTeam.name).toBe('Updated Name');
    });

    it('Team E2E – B.14. Update team – team bukan milik org', async () => {
        await request(app.getHttpServer())
            .patch(`/organizations/${orgId1}/teams/${teamId2}`)
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ name: 'Cross-tenant Update' })
            .expect(404);
    });

    it('Team E2E – B.15. Update team – user bukan member org', async () => {
        await request(app.getHttpServer())
            .patch(`/organizations/${orgId1}/teams/${teamId1}`)
            .set('Authorization', `Bearer ${tokenC}`)
            .send({ name: 'Non-member Update' })
            .expect(403);
    });

    it('Team E2E – B.16. Delete team – soft delete', async () => {
        await request(app.getHttpServer())
            .delete(`/organizations/${orgId1}/teams/${teamId1}`)
            .set('Authorization', `Bearer ${tokenA}`)
            .expect(200);

        const dbTeam = await prisma.team.findUnique({
            where: { id: teamId1 },
        });
        expect(dbTeam.status).toBe('inactive');

        // Verify that list teams no longer returns this team
        const listRes = await request(app.getHttpServer())
            .get(`/organizations/${orgId1}/teams`)
            .set('Authorization', `Bearer ${tokenA}`)
            .expect(200);
        const teamFound = listRes.body.find((t: any) => t.id === teamId1);
        expect(teamFound).toBeUndefined();
    });

    it('Team E2E – B.17. Delete team – team bukan milik org', async () => {
        await request(app.getHttpServer())
            .delete(`/organizations/${orgId1}/teams/${teamId2}`)
            .set('Authorization', `Bearer ${tokenA}`)
            .expect(404);
    });

    it('Team E2E – B.18. Delete team – user bukan member org', async () => {
        await request(app.getHttpServer())
            .delete(`/organizations/${orgId1}/teams/${teamId1}`)
            .set('Authorization', `Bearer ${tokenC}`)
            .expect(403);
    });

    // ==========================================
    // C. Team Members – Add
    // ==========================================

    it('Team E2E – C.19. Add member – actor & target sama-sama member org, target belum member team (happy path)', async () => {
        // Restore teamId1 to active status via Prisma
        await prisma.team.update({
            where: { id: teamId1 },
            data: { status: 'active' },
        });

        // Ensure user B is not in teamId1
        await prisma.teamMember.deleteMany({
            where: { teamId: teamId1, userId: userBId },
        });

        const res = await request(app.getHttpServer())
            .post(`/organizations/${orgId1}/teams/${teamId1}/members`)
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ userId: userBId, role: 'viewer' })
            .expect(201);

        const dbMember = await prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId: teamId1,
                    userId: userBId,
                },
            },
        });
        expect(dbMember).toBeDefined();
        expect(dbMember.role).toBe('viewer');
    });

    it('Team E2E – C.20. Add member – actor bukan member org', async () => {
        await request(app.getHttpServer())
            .post(`/organizations/${orgId1}/teams/${teamId1}/members`)
            .set('Authorization', `Bearer ${tokenC}`)
            .send({ userId: userBId, role: 'viewer' })
            .expect(403);
    });

    it('Team E2E – C.21. Add member – target bukan member org', async () => {
        // User C is not in orgId1
        await request(app.getHttpServer())
            .post(`/organizations/${orgId1}/teams/${teamId1}/members`)
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ userId: userCId, role: 'viewer' })
            .expect(403);
    });

    it('Team E2E – C.22. Add member – team bukan milik org', async () => {
        await request(app.getHttpServer())
            .post(`/organizations/${orgId1}/teams/${teamId2}/members`)
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ userId: userBId, role: 'viewer' })
            .expect(404);
    });

    it('Team E2E – C.23. Add member – target sudah member team (conflict)', async () => {
        // Target User B is already in teamId1 from C.19
        const res = await request(app.getHttpServer())
            .post(`/organizations/${orgId1}/teams/${teamId1}/members`)
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ userId: userBId, role: 'viewer' })
            .expect(409);

        expect(res.body.message).toBe('User is already a member of this team');
    });

    // ==========================================
    // D. Team Members – Get list
    // ==========================================

    it('Team E2E – D.24. Get members – user member org & team milik org', async () => {
        const res = await request(app.getHttpServer())
            .get(`/organizations/${orgId1}/teams/${teamId1}/members`)
            .set('Authorization', `Bearer ${tokenA}`)
            .expect(200);

        expect(Array.isArray(res.body)).toBe(true);
        const memberB = res.body.find((m: any) => m.userId === userBId);
        expect(memberB).toBeDefined();
        expect(memberB.user.id).toBe(userBId);
        expect(memberB.user.name).toBeDefined();
        expect(memberB.user.email).toBeDefined();
    });

    it('Team E2E – D.25. Get members – team bukan milik org', async () => {
        await request(app.getHttpServer())
            .get(`/organizations/${orgId1}/teams/${teamId2}/members`)
            .set('Authorization', `Bearer ${tokenA}`)
            .expect(404);
    });

    it('Team E2E – D.26. Get members – user bukan member org', async () => {
        await request(app.getHttpServer())
            .get(`/organizations/${orgId1}/teams/${teamId1}/members`)
            .set('Authorization', `Bearer ${tokenC}`)
            .expect(403);
    });

    // ==========================================
    // E. Team Members – Update role
    // ==========================================

    it('Team E2E – E.27. Update member role – actor & target member org, target member team (happy path)', async () => {
        await request(app.getHttpServer())
            .patch(`/organizations/${orgId1}/teams/${teamId1}/members/${userBId}`)
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ role: 'manager' })
            .expect(200);

        const dbMember = await prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId: teamId1,
                    userId: userBId,
                },
            },
        });
        expect(dbMember.role).toBe('manager');
    });

    it('Team E2E – E.28. Update member role – target bukan member org', async () => {
        await request(app.getHttpServer())
            .patch(`/organizations/${orgId1}/teams/${teamId1}/members/${userCId}`)
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ role: 'viewer' })
            .expect(403);
    });

    it('Team E2E – E.29. Update member role – target bukan member team', async () => {
        // Register user D
        const resRegD = await request(app.getHttpServer())
            .post('/auth/register')
            .send({ name: 'User D', email: emailD, password: 'password123' })
            .expect(201);
        userDId = resRegD.body.user.id;

        // Add User D to organization
        await prisma.organizationMember.create({
            data: {
                organizationId: orgId1,
                userId: userDId,
                role: 'member',
            },
        });

        // User D is in orgId1 but not teamId1
        const res = await request(app.getHttpServer())
            .patch(`/organizations/${orgId1}/teams/${teamId1}/members/${userDId}`)
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ role: 'viewer' })
            .expect(404);

        expect(res.body.message).toBe('Target user is not a member of this team');
    });

    it('Team E2E – E.30. Update member role – team bukan milik org', async () => {
        await request(app.getHttpServer())
            .patch(`/organizations/${orgId1}/teams/${teamId2}/members/${userBId}`)
            .set('Authorization', `Bearer ${tokenA}`)
            .send({ role: 'viewer' })
            .expect(404);
    });

    it('Team E2E – E.31. Update member role – actor bukan member org', async () => {
        await request(app.getHttpServer())
            .patch(`/organizations/${orgId1}/teams/${teamId1}/members/${userBId}`)
            .set('Authorization', `Bearer ${tokenC}`)
            .send({ role: 'viewer' })
            .expect(403);
    });

    // ==========================================
    // F. Team Members – Remove
    // ==========================================

    it('Team E2E – F.32. Remove member – actor & target member org, target member team (happy path)', async () => {
        await request(app.getHttpServer())
            .delete(`/organizations/${orgId1}/teams/${teamId1}/members/${userBId}`)
            .set('Authorization', `Bearer ${tokenA}`)
            .expect(200);

        const dbMember = await prisma.teamMember.findUnique({
            where: {
                teamId_userId: {
                    teamId: teamId1,
                    userId: userBId,
                },
            },
        });
        expect(dbMember).toBeNull();
    });

    it('Team E2E – F.33. Remove member – target bukan member team', async () => {
        // User B was removed in F.32, so B is not in teamId1
        const res = await request(app.getHttpServer())
            .delete(`/organizations/${orgId1}/teams/${teamId1}/members/${userBId}`)
            .set('Authorization', `Bearer ${tokenA}`)
            .expect(404);

        expect(res.body.message).toBe('Team member is not a part of this team');
    });

    it('Team E2E – F.34. Remove member – target bukan member org', async () => {
        await request(app.getHttpServer())
            .delete(`/organizations/${orgId1}/teams/${teamId1}/members/${userCId}`)
            .set('Authorization', `Bearer ${tokenA}`)
            .expect(403);
    });

    it('Team E2E – F.35. Remove member – team bukan milik org', async () => {
        await request(app.getHttpServer())
            .delete(`/organizations/${orgId1}/teams/${teamId2}/members/${userBId}`)
            .set('Authorization', `Bearer ${tokenA}`)
            .expect(404);
    });

    it('Team E2E – F.36. Remove member – actor bukan member org', async () => {
        await request(app.getHttpServer())
            .delete(`/organizations/${orgId1}/teams/${teamId1}/members/${userBId}`)
            .set('Authorization', `Bearer ${tokenC}`)
            .expect(403);
    });
});
