import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/prisma/prisma.service';
import { InvitationRepository } from 'src/invitation/invitation.repository';
import { InviteStatus, OrganizationRole } from 'generated/prisma/client';
import * as crypto from 'crypto';

describe('InvitationRepository (Integration)', () => {
    let repository: InvitationRepository;
    let prisma: PrismaService;

    beforeAll(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [InvitationRepository, PrismaService],
        }).compile();

        repository = module.get<InvitationRepository>(InvitationRepository);
        prisma = module.get<PrismaService>(PrismaService);
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    beforeEach(async () => {
        // Bersihkan data sebelum setiap tes dari child ke parent
        await prisma.invitation.deleteMany();
        await prisma.organizationMember.deleteMany();
        await prisma.user.deleteMany();
        await prisma.organization.deleteMany();
    });

    // --- UTILITY UNTUK SEEDING DATA TEST ---
    async function createTestUser(email: string = 'user@test.com') {
        return prisma.user.create({
            data: { id: crypto.randomUUID(), email },
        });
    }

    async function createTestOrganization() {
        return prisma.organization.create({
            data: { id: crypto.randomUUID(), name: 'Test Org' },
        });
    }

    // --- TEST SUITES ---

    describe('createOrResetInvitation', () => {
        it('harus membuat undangan baru jika email belum pernah diundang', async () => {
            const inviter = await createTestUser('inviter@test.com');
            const org = await createTestOrganization();
            const futureDate = new Date(Date.now() + 86400000); // Besok

            const params = {
                email: 'newbie@test.com',
                orgId: org.id,
                invitedById: inviter.id,
                role: OrganizationRole.member,
                expiresAt: futureDate,
            };

            const result = await repository.createOrResetInvitation(params);

            expect(result.email).toBe(params.email);
            expect(result.status).toBe(InviteStatus.PENDING);
            expect(result.role).toBe(OrganizationRole.member);
            expect(result.token).toBeDefined();

            // Verifikasi di database
            const dbRecord = await prisma.invitation.findUnique({ where: { id: result.id } });
            expect(dbRecord).not.toBeNull();
        });

        it('harus memperbarui token dan expiresAt jika email sudah pernah diundang (upsert)', async () => {
            const inviter = await createTestUser('inviter@test.com');
            const org = await createTestOrganization();

            // 1. Buat undangan pertama
            const firstInvite = await repository.createOrResetInvitation({
                email: 'target@test.com',
                orgId: org.id,
                invitedById: inviter.id,
                role: OrganizationRole.member,
                expiresAt: new Date(),
            });

            // 2. Reset undangan (panggil fungsi yang sama)
            const futureDate = new Date(Date.now() + 86400000);
            const secondInvite = await repository.createOrResetInvitation({
                email: 'target@test.com',
                orgId: org.id,
                invitedById: inviter.id,
                role: OrganizationRole.member, // Ubah role
                expiresAt: futureDate,
            });

            expect(secondInvite.id).toBe(firstInvite.id); // ID harus sama karena di-upsert
            expect(secondInvite.token).not.toBe(firstInvite.token); // Token harus diperbarui
            expect(secondInvite.role).toBe(OrganizationRole.member);
        });
    });

    describe('findUserByEmail & isUserMemberOfOrgByEmail', () => {
        it('harus mengembalikan null jika user tidak ditemukan', async () => {
            const user = await repository.findUserByEmail('notfound@test.com');
            expect(user).toBeNull();
        });

        it('harus mengembalikan true jika user terdaftar dan merupakan member organisasi', async () => {
            const user = await createTestUser('member@test.com');
            const org = await createTestOrganization();

            await prisma.organizationMember.create({
                data: {
                    userId: user.id,
                    organizationId: org.id,
                    role: OrganizationRole.member,
                },
            });

            const isMember = await repository.isUserMemberOfOrgByEmail(user.email, org.id);
            expect(isMember).toBe(true);
        });

        it('harus mengembalikan false jika user ada tapi bukan member', async () => {
            const user = await createTestUser('notmember@test.com');
            const org = await createTestOrganization();

            const isMember = await repository.isUserMemberOfOrgByEmail(user.email, org.id);
            expect(isMember).toBe(false);
        });
    });

    describe('findByToken', () => {
        it('harus menemukan invitation berdasarkan token', async () => {
            const inviter = await createTestUser();
            const org = await createTestOrganization();
            const invite = await repository.createOrResetInvitation({
                email: 'testtoken@test.com',
                orgId: org.id,
                invitedById: inviter.id,
                role: OrganizationRole.member,
                expiresAt: new Date(),
            });

            const result = await repository.findByToken(invite.token);
            expect(result).not.toBeNull();
            expect(result?.email).toBe('testtoken@test.com');
        });
    });

    describe('findByEmailAndOrg', () => {
        it('harus menemukan invitation spesifik untuk email dan orgId', async () => {
            const inviter = await createTestUser();
            const org = await createTestOrganization();
            await repository.createOrResetInvitation({
                email: 'findme@test.com',
                orgId: org.id,
                invitedById: inviter.id,
                role: OrganizationRole.member,
                expiresAt: new Date(),
            });

            const result = await repository.findByEmailAndOrg('findme@test.com', org.id);
            expect(result).not.toBeNull();
            expect(result?.organizationId).toBe(org.id);
        });
    });

    describe('findMembershipForUserInOrg', () => {
        it('harus mengembalikan membership user di sebuah organisasi', async () => {
            const user = await createTestUser();
            const org = await createTestOrganization();
            await prisma.organizationMember.create({
                data: { userId: user.id, organizationId: org.id, role: OrganizationRole.manager },
            });

            const result = await repository.findMembershipForUserInOrg(org.id, user.id);
            expect(result).not.toBeNull();
            expect(result?.role).toBe(OrganizationRole.manager);
        });
    });

    describe('updateStatus', () => {
        it('harus memperbarui status dari invitation', async () => {
            const inviter = await createTestUser();
            const org = await createTestOrganization();
            const invite = await repository.createOrResetInvitation({
                email: 'updatestatus@test.com',
                orgId: org.id,
                invitedById: inviter.id,
                role: OrganizationRole.member,
                expiresAt: new Date(),
            });

            const updated = await repository.updateStatus(invite.id, InviteStatus.ACCEPTED);
            expect(updated.status).toBe(InviteStatus.ACCEPTED);
        });
    });

    describe('acceptInvitationTx', () => {
        it('harus membuat member baru dan mengubah status invitation menjadi ACCEPTED dalam 1 transaksi', async () => {
            const inviter = await createTestUser('inviter@test.com');
            const targetUser = await createTestUser('target@test.com');
            const org = await createTestOrganization();

            const invite = await repository.createOrResetInvitation({
                email: targetUser.email,
                orgId: org.id,
                invitedById: inviter.id,
                role: OrganizationRole.member,
                expiresAt: new Date(),
            });

            await repository.acceptInvitationTx({
                userId: targetUser.id,
                organizationId: org.id,
                role: OrganizationRole.member,
                invitationId: invite.id,
            });

            // Verifikasi Transaksi Berhasil
            const member = await prisma.organizationMember.findFirst({
                where: { userId: targetUser.id, organizationId: org.id },
            });
            expect(member).not.toBeNull();

            const updatedInvite = await prisma.invitation.findUnique({ where: { id: invite.id } });
            expect(updatedInvite?.status).toBe('ACCEPTED');
            expect(updatedInvite?.userId).toBe(targetUser.id);
            expect(updatedInvite?.acceptedAt).not.toBeNull();
        });

        it('harus rollback transaksi jika terjadi error (misal: ID invitation tidak ada)', async () => {
            const user = await createTestUser();
            const org = await createTestOrganization();

            // Memaksa transaksi gagal dengan memberikan ID invitation yang salah
            await expect(
                repository.acceptInvitationTx({
                    userId: user.id,
                    organizationId: org.id,
                    role: OrganizationRole.member,
                    invitationId: 'invalid-id-yang-pasti-gagal',
                })
            ).rejects.toThrow();

            // Verifikasi Rollback: OrganizationMember tidak boleh terbuat
            const member = await prisma.organizationMember.findFirst({
                where: { userId: user.id, organizationId: org.id },
            });
            expect(member).toBeNull();
        });
    });
});