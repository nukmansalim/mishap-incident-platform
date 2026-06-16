import {
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException, GoneException
} from '@nestjs/common';
import { InvitationRepository } from './invitation.repository';
import { InviteStatus } from 'generated/prisma/client';
import { addDays } from 'date-fns';
import { User, OrganizationRole } from 'generated/prisma/client';
import { OrganizationMembershipService } from 'src/organization/organization-membership.service';

@Injectable()
export class InvitationService {
    constructor(private readonly invitationRepo: InvitationRepository,
        private readonly membershipService: OrganizationMembershipService
    ) { }

    async createInvitationForOrg(
        orgId: string,
        inviterUserId: string,
        email: string,
        role = OrganizationRole.member,
    ) {
        const membership = await this.membershipService.isUserMemberOfOrg(
            orgId,
            inviterUserId,
        );

        if (!membership) {
            throw new NotFoundException('Organization not found or not a member');
        }

        if (!['owner', 'manager'].includes(membership.role)) {
            throw new ForbiddenException(
                'Only owner/manager can invite members to this organization',
            );
        }

        const existing = await this.invitationRepo.findByEmailAndOrg(email, orgId);

        if (existing && existing.status === InviteStatus.PENDING) {
            throw new ConflictException(
                'An active invitation already exists for this email',
            );
        }
        const alreadyMember =
            await this.invitationRepo.isUserMemberOfOrgByEmail(email, orgId);

        if (alreadyMember) {
            throw new ConflictException('User is already a member of this organization');
        }

        const expiresAt = addDays(new Date(), 7);

        return this.invitationRepo.createOrResetInvitation({
            email,
            orgId,
            invitedById: inviterUserId,
            role,
            expiresAt,
        });
    }
    async validateToken(token: string) {
        const invitation = await this.invitationRepo.findByToken(token);
        if (!invitation) throw new GoneException('Invitation not found');
        if (invitation.status === 'ACCEPTED') {
            throw new GoneException('Invitation has ben already accepted')
        }

        if (invitation.status !== 'PENDING') throw new GoneException('Invitation is no longer valid');
        if (invitation.expiresAt < new Date()) {
            await this.invitationRepo.updateStatus(invitation.id, 'EXPIRED');
            throw new GoneException('Invitation has expired');
        }
        return invitation;
    }
    async acceptInvitation(token: string, currentUser: User) {
        const invitation = await this.validateToken(token);
        console.log('INVITATION EMAIL:', invitation.email);
        console.log('CURRENT USER:', currentUser);
        if (invitation.email !== currentUser.email) {
            throw new ForbiddenException('This invitation is not for your account');
        }
        if (invitation.status === 'ACCEPTED') {
            throw new GoneException('Invitation has ben already accepted')
        }

        return this.invitationRepo.acceptInvitationTx({
            userId: currentUser.id,
            organizationId: invitation.organizationId,
            role: invitation.role,
            invitationId: invitation.id,
        });
    }

}
