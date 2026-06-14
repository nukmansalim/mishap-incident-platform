import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma/prisma.service';
import { ROLES_KEY } from 'src/decorators/org-role';
@Injectable()
export class OrgRoleGuard implements CanActivate {
    constructor(
        private reflector: Reflector,
        private prisma: PrismaService,
    ) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {

        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles) {
            return true;
        }

        const request = context.switchToHttp().getRequest();
        const user = request.user;
        const orgId = request.params.orgId;
        if (!user || !orgId) {
            throw new ForbiddenException('User context or Organization ID missing');
        }

        const membership = await this.prisma.organizationMember.findUnique({
            where: {
                organizationId_userId: {
                    organizationId: orgId, userId: user.id,
                }


            },
        });


        if (!membership) {
            throw new ForbiddenException('You are not a member of this organization');
        }

        if (!requiredRoles.includes(membership.role)) {
            throw new ForbiddenException(`Only ${requiredRoles.join('/')} can perform this action`);
        }

        return true;
    }
}