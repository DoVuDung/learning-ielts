import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { Role } from '../roles.enum';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function createMockContext(user?: any): ExecutionContext {
  return {
    getHandler: () => () => {},
    getClass: () => class TestController {},
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as any;
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;
  let origAdminEmails: string | undefined;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
    origAdminEmails = process.env.ADMIN_EMAILS;
  });

  afterEach(() => {
    if (origAdminEmails === undefined) {
      delete process.env.ADMIN_EMAILS;
    } else {
      process.env.ADMIN_EMAILS = origAdminEmails;
    }
  });

  it('is defined', () => {
    expect(guard).toBeDefined();
  });

  // ─── No roles required ─────────────────────────────────────────────────────

  it('allows access when no roles are required (undefined)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const ctx = createMockContext({ id: '1', role: Role.USER });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows access when required roles list is empty', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);
    const ctx = createMockContext({ id: '1', role: Role.USER });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  // ─── Missing or invalid user ───────────────────────────────────────────────

  it('throws ForbiddenException with correct message when user is undefined', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    const ctx = createMockContext(undefined);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(ctx)).toThrow('Access denied: user role not found');
  });

  it('throws ForbiddenException when user has no role property', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    const ctx = createMockContext({ id: '1', email: 'norole@example.com' });
    // email is not in default admin list
    delete process.env.ADMIN_EMAILS;
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(ctx)).toThrow('Access denied: user role not found');
  });

  // ─── Insufficient role ─────────────────────────────────────────────────────

  it('throws ForbiddenException when user role does not match required roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    const ctx = createMockContext({ id: '1', role: Role.USER });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(ctx)).toThrow('Access denied: insufficient role');
  });

  // ─── Sufficient role ───────────────────────────────────────────────────────

  it('allows access when user role matches the single required role', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);
    const ctx = createMockContext({ id: '1', role: Role.ADMIN });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows access when user role matches one of multiple required roles', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN, Role.USER]);
    const ctx = createMockContext({ id: '1', role: Role.USER });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  // ─── Email-based ADMIN promotion ───────────────────────────────────────────

  it('promotes user to ADMIN when email is in default ADMIN_EMAILS', () => {
    delete process.env.ADMIN_EMAILS;
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

    const ctx = createMockContext({
      id: '1',
      email: 'vudungoik2016@gmail.com',
      // no role property – guard should infer ADMIN from email
    });

    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('promotes user to ADMIN when email matches custom ADMIN_EMAILS env var', () => {
    process.env.ADMIN_EMAILS = 'custom@admin.com,another@admin.com';
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

    const ctx = createMockContext({ id: '1', email: 'another@admin.com' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('is case-insensitive when matching admin email', () => {
    process.env.ADMIN_EMAILS = 'Admin@Example.com';
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

    const ctx = createMockContext({ id: '1', email: 'admin@example.com' });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('does NOT promote non-admin email to ADMIN role', () => {
    process.env.ADMIN_EMAILS = 'admin@example.com';
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

    const ctx = createMockContext({ id: '1', email: 'regular@user.com' });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(ctx)).toThrow('Access denied: user role not found');
  });

  it('handles empty ADMIN_EMAILS env var gracefully', () => {
    process.env.ADMIN_EMAILS = '';
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.ADMIN]);

    const ctx = createMockContext({ id: '1', email: 'someone@example.com' });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });
});
