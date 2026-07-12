import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import type { GoogleProfile, AuthUser } from './dto/auth.dto';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const baseUser = {
  id: 'user-1',
  googleId: 'google-123',
  email: 'test@example.com',
  name: 'Test User',
  avatarUrl: 'https://example.com/avatar.jpg',
  isPremium: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const expectedAuthUser: AuthUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  avatarUrl: 'https://example.com/avatar.jpg',
  isPremium: false,
  role: 'USER',
};

const googleProfile: GoogleProfile = {
  id: 'google-123',
  emails: [{ value: 'test@example.com' }],
  displayName: 'Test User',
  photos: [{ value: 'https://example.com/avatar.jpg' }],
};

const usersServiceMock = {
  findByGoogleId: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
};

const jwtServiceMock = {
  sign: jest.fn().mockReturnValue('signed-jwt-token'),
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersServiceMock },
        { provide: JwtService, useValue: jwtServiceMock },
      ],
    }).compile();

    service = module.get(AuthService);
    jest.clearAllMocks();
    jwtServiceMock.sign.mockReturnValue('signed-jwt-token');
  });

  // ─── validateGoogleUser ───────────────────────────────────────────────────

  describe('validateGoogleUser', () => {
    it('returns updated existing user when googleId is found', async () => {
      usersServiceMock.findByGoogleId.mockResolvedValue(baseUser);
      usersServiceMock.update.mockResolvedValue(baseUser);

      const result = await service.validateGoogleUser(googleProfile);

      expect(usersServiceMock.findByGoogleId).toHaveBeenCalledWith('google-123');
      expect(usersServiceMock.update).toHaveBeenCalledWith('user-1', {
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
      });
      expect(usersServiceMock.create).not.toHaveBeenCalled();
      expect(result).toEqual(expectedAuthUser);
    });

    it('creates a new user when googleId is not found', async () => {
      usersServiceMock.findByGoogleId.mockResolvedValue(null);
      usersServiceMock.create.mockResolvedValue(baseUser);

      const result = await service.validateGoogleUser(googleProfile);

      expect(usersServiceMock.create).toHaveBeenCalledWith({
        googleId: 'google-123',
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
      });
      expect(usersServiceMock.update).not.toHaveBeenCalled();
      expect(result).toEqual(expectedAuthUser);
    });

    it('uses null as avatarUrl when photos array is empty', async () => {
      const noPhotosProfile: GoogleProfile = { ...googleProfile, photos: [] };
      const userNoAvatar = { ...baseUser, avatarUrl: null };
      usersServiceMock.findByGoogleId.mockResolvedValue(null);
      usersServiceMock.create.mockResolvedValue(userNoAvatar);

      const result = await service.validateGoogleUser(noPhotosProfile);

      expect(usersServiceMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ avatarUrl: null }),
      );
      expect(result.avatarUrl).toBeNull();
    });

    it('uses null as avatarUrl when photos is undefined', async () => {
      const noPhotosProfile: GoogleProfile = { ...googleProfile, photos: undefined };
      const userNoAvatar = { ...baseUser, avatarUrl: null };
      usersServiceMock.findByGoogleId.mockResolvedValue(null);
      usersServiceMock.create.mockResolvedValue(userNoAvatar);

      const result = await service.validateGoogleUser(noPhotosProfile);

      expect(usersServiceMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ avatarUrl: null }),
      );
      expect(result.avatarUrl).toBeNull();
    });

    it('returns role from user record when role field is present', async () => {
      const adminUser = { ...baseUser, role: 'ADMIN' };
      usersServiceMock.findByGoogleId.mockResolvedValue(adminUser);
      usersServiceMock.update.mockResolvedValue(adminUser);

      const result = await service.validateGoogleUser(googleProfile);

      expect(result.role).toBe('ADMIN');
    });

    it('defaults to USER role when user record has no role field', async () => {
      const noRoleUser = { ...baseUser };
      delete (noRoleUser as any).role;
      usersServiceMock.findByGoogleId.mockResolvedValue(noRoleUser);
      usersServiceMock.update.mockResolvedValue(noRoleUser);

      const result = await service.validateGoogleUser(googleProfile);

      expect(result.role).toBe('USER');
    });

    it('maps all required AuthUser fields correctly', async () => {
      usersServiceMock.findByGoogleId.mockResolvedValue(baseUser);
      usersServiceMock.update.mockResolvedValue(baseUser);

      const result = await service.validateGoogleUser(googleProfile);

      expect(result).toMatchObject({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
        isPremium: false,
      });
    });
  });

  // ─── login ────────────────────────────────────────────────────────────────

  describe('login', () => {
    it('calls jwtService.sign with correct payload and returns token', () => {
      const token = service.login(expectedAuthUser);

      expect(jwtServiceMock.sign).toHaveBeenCalledTimes(1);
      expect(jwtServiceMock.sign).toHaveBeenCalledWith({
        sub: 'user-1',
        email: 'test@example.com',
      });
      expect(token).toBe('signed-jwt-token');
    });

    it('does not include extra user fields in JWT payload', () => {
      service.login(expectedAuthUser);

      const [payload] = jwtServiceMock.sign.mock.calls[0];
      expect(Object.keys(payload)).toEqual(['sub', 'email']);
    });
  });

  // ─── getProfile ───────────────────────────────────────────────────────────

  describe('getProfile', () => {
    it('returns AuthUser shape when user exists', async () => {
      usersServiceMock.findById.mockResolvedValue(baseUser);

      const result = await service.getProfile('user-1');

      expect(usersServiceMock.findById).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(expectedAuthUser);
    });

    it('returns null when user does not exist', async () => {
      usersServiceMock.findById.mockResolvedValue(null);

      const result = await service.getProfile('missing-id');

      expect(result).toBeNull();
    });

    it('returns ADMIN role for admin user via getProfile', async () => {
      const adminUser = { ...baseUser, role: 'ADMIN' };
      usersServiceMock.findById.mockResolvedValue(adminUser);

      const result = await service.getProfile('user-1');

      expect(result?.role).toBe('ADMIN');
    });
  });
});
