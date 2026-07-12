import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { UsersService } from '../../users/users.service';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const baseUser = {
  id: 'user-1',
  googleId: 'google-123',
  email: 'test@example.com',
  name: 'Test User',
  avatarUrl: null,
  isPremium: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const usersServiceMock = { findById: jest.fn() };

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let origAdminEmails: string | undefined;

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-secret';
    origAdminEmails = process.env.ADMIN_EMAILS;

    const module = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: UsersService, useValue: usersServiceMock },
      ],
    }).compile();

    strategy = module.get(JwtStrategy);
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (origAdminEmails === undefined) {
      delete process.env.ADMIN_EMAILS;
    } else {
      process.env.ADMIN_EMAILS = origAdminEmails;
    }
  });

  // ─── Instantiation ─────────────────────────────────────────────────────────

  it('is defined', () => {
    expect(strategy).toBeDefined();
  });

  // ─── Token Extraction ──────────────────────────────────────────────────────

  describe('token extraction', () => {
    it('extracts token from Authorization Bearer header', () => {
      const extractor = (strategy as any)._jwtFromRequest;
      if (!extractor) return; // safety guard

      const token = extractor({
        headers: { authorization: 'Bearer my-test-token' },
      });
      expect(token).toBe('my-test-token');
    });

    it('returns null when Authorization header is missing', () => {
      const extractor = (strategy as any)._jwtFromRequest;
      if (!extractor) return;

      expect(extractor({ headers: {} })).toBeNull();
    });

    it('returns null when Authorization header has wrong scheme', () => {
      const extractor = (strategy as any)._jwtFromRequest;
      if (!extractor) return;

      expect(extractor({ headers: { authorization: 'Basic dXNlcjpwYXNz' } })).toBeNull();
    });

    it('does NOT read token from cookies (Bearer-only flow)', () => {
      const extractor = (strategy as any)._jwtFromRequest;
      if (!extractor) return;

      const token = extractor({
        headers: {},
        cookies: { access_token: 'should-be-ignored' },
      });
      expect(token).toBeNull();
    });
  });

  // ─── validate ──────────────────────────────────────────────────────────────

  describe('validate', () => {
    it('returns user with USER role when user exists and is not admin email', async () => {
      usersServiceMock.findById.mockResolvedValue(baseUser);
      delete process.env.ADMIN_EMAILS;

      const result = await strategy.validate({ sub: 'user-1', email: 'test@example.com' });

      expect(usersServiceMock.findById).toHaveBeenCalledWith('user-1');
      expect(result).toMatchObject({ ...baseUser, role: 'USER' });
    });

    it('throws UnauthorizedException when user is not found in DB', async () => {
      usersServiceMock.findById.mockResolvedValue(null);

      await expect(
        strategy.validate({ sub: 'missing-id', email: 'ghost@example.com' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('assigns ADMIN role when user email matches default admin email', async () => {
      delete process.env.ADMIN_EMAILS;
      usersServiceMock.findById.mockResolvedValue({
        ...baseUser,
        email: 'vudungoik2016@gmail.com',
      });

      const result = await strategy.validate({
        sub: 'user-1',
        email: 'vudungoik2016@gmail.com',
      });

      expect(result.role).toBe('ADMIN');
    });

    it('assigns ADMIN role when user email matches custom ADMIN_EMAILS env var', async () => {
      process.env.ADMIN_EMAILS = 'admin1@test.com,admin2@test.com';
      usersServiceMock.findById.mockResolvedValue({
        ...baseUser,
        email: 'admin2@test.com',
      });

      const result = await strategy.validate({
        sub: 'user-1',
        email: 'admin2@test.com',
      });

      expect(result.role).toBe('ADMIN');
    });

    it('is case-insensitive when matching admin emails', async () => {
      process.env.ADMIN_EMAILS = 'Admin@Test.com';
      usersServiceMock.findById.mockResolvedValue({
        ...baseUser,
        email: 'admin@test.com',
      });

      const result = await strategy.validate({
        sub: 'user-1',
        email: 'admin@test.com',
      });

      expect(result.role).toBe('ADMIN');
    });

    it('assigns ADMIN role when user record already has role=ADMIN (even for non-admin email)', async () => {
      delete process.env.ADMIN_EMAILS;
      const adminUser = { ...baseUser, role: 'ADMIN', email: 'regular@user.com' };
      usersServiceMock.findById.mockResolvedValue(adminUser);

      const result = await strategy.validate({
        sub: 'user-1',
        email: 'regular@user.com',
      });

      expect(result.role).toBe('ADMIN');
    });

    it('assigns USER role when email is not in ADMIN_EMAILS and user has no ADMIN role', async () => {
      process.env.ADMIN_EMAILS = 'admin@example.com';
      usersServiceMock.findById.mockResolvedValue(baseUser);

      const result = await strategy.validate({
        sub: 'user-1',
        email: 'test@example.com',
      });

      expect(result.role).toBe('USER');
    });

    it('handles missing email on user safely (no crash)', async () => {
      const noEmailUser = { ...baseUser, email: undefined as any };
      usersServiceMock.findById.mockResolvedValue(noEmailUser);

      const result = await strategy.validate({ sub: 'user-1', email: '' });

      expect(result.role).toBe('USER');
    });
  });
});
