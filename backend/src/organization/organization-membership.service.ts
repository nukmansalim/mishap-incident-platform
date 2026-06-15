import { Injectable } from "@nestjs/common";
import { OrganizationRole } from "generated/prisma/enums";
import { ForbiddenException } from "@nestjs/common";
import { PrismaService } from "src/prisma/prisma.service";

@Injectable()
export class OrganizationMembershipService {

    constructor(private prisma: PrismaService) { }
    async isUserMemberOfOrg(userId: string, orgId: string) {
        const membership = await this.prisma.organizationMember.findUnique({
            where: {
                organizationId_userId: { organizationId: orgId, userId },
            },
        });
        return membership;
    }
    async ensureUserIsMemberOfOrg(userId: string, orgId: string) {
        const membership = await this.prisma.organizationMember.findUnique({
            where: {
                organizationId_userId: { organizationId: orgId, userId },
            },
        });

        if (!membership) {
            throw new ForbiddenException('You are not a member of this organization');
        }

        return membership;
    }
    async validateUserRoleInOrg(
        userId: string,
        orgId: string,
        requiredRoles: OrganizationRole[],
    ): Promise<boolean> {

        const membership = await this.prisma.organizationMember.findUnique({
            where: {
                organizationId_userId: { organizationId: orgId, userId },
            },
        });

        if (!membership) {
            throw new ForbiddenException('You are not a member of this organization');
        }

        if (!requiredRoles.includes(membership.role)) {
            throw new ForbiddenException(
                `Only ${requiredRoles.join('/')} can perform this action`,
            );
        }

        return true;
    }
}