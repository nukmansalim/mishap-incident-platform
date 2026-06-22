import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OrganizationRole } from '../../../generated/prisma/enums';
import { ROLES_KEY } from '../../common/decorators/org-role';
import { OrganizationMembershipService } from '../../organization/organization-membership.service';
@Injectable()
export class OrgRoleGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private membershipService: OrganizationMembershipService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<OrganizationRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const orgId = request.params.orgId;
    if (!user || !orgId) {
      throw new ForbiddenException('User context or Organization ID missing');
    }

    return this.membershipService.validateUserRoleInOrg(
      user.id,
      orgId,
      requiredRoles,
    );
  }
}
