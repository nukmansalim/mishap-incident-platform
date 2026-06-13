import {
    ConflictException,
    ForbiddenException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InvitationRepository } from './invitation.repository';
import { InviteStatus } from 'generated/prisma/client';
import { addDays } from 'date-fns';

@Injectable()
export class InvitationService {
    constructor(private readonly invitationRepo: InvitationRepository) { }

    async createInvitationForOrg(
        orgId: string,
        inviterUserId: string,
        email: string,
        role = 'member',
    ) {
        const membership = await this.invitationRepo.findMembershipForUserInOrg(
            orgId,
            inviterUserId,
        );

        if (!membership) {
            throw new NotFoundException('Organization not found or not a member');
        }

        if (!['owner', 'admin'].includes(membership.role)) {
            throw new ForbiddenException(
                'Only owner/admin can invite members to this organization',
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
}
