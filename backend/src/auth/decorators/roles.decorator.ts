import { SetMetadata } from '@nestjs/common';
import { Role } from '../roles.enum';

export const ROLES_KEY = 'roles';

/**
 * Decorator to assign required roles to a route or controller.
 *
 * @example
 * \@Roles(Role.ADMIN)
 * \@Get('users')
 * getUsers() {}
 */
export const Roles = (...roles: (Role | string)[]) => SetMetadata(ROLES_KEY, roles);
