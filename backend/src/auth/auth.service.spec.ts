import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import type { GoogleProfile, AuthUser } from './dto/auth.dto';

const mockUser = {
  id: 'user-1',
  googleId: 'google-123',
  email: 'test@example.com',
  name: 'Test User',
  avatarUrl: 'https://example.com/avatar.jpg',
  isPremium: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockAuthUser: AuthUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  avatarUrl: 'https://example.com/avatar.jpg',
  isPremium: false,
  role: 'USER',
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

const googleProfile: GoogleProfile = {
  id: 'google-123',
  emails: [{ value: 'test@example.com' }],
  displayName: 'Test User',
  photos: [{ value: 'https://example.com/avatar.jpg' }],
};

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

  describe('validateGoogleUser', () => {
    it('returns existing user (updated) when googleId is found', async () => {
      usersServiceMock.findByGoogleId.mockResolvedValue(mockUser);
      usersServiceMock.update.mockResolvedValue(mockUser);

      const result = await service.validateGoogleUser(googleProfile);

      expect(usersServiceMock.findByGoogleId).toHaveBeenCalledWith('google-123');
      expect(usersServiceMock.update).toHaveBeenCalledWith('user-1', {
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
      });
      expect(result).toEqual(mockAuthUser);
    });

    it('creates a new user when googleId is not found', async () => {
      usersServiceMock.findByGoogleId.mockResolvedValue(null);
      usersServiceMock.create.mockResolvedValue(mockUser);

      const result = await service.validateGoogleUser(googleProfile);

      expect(usersServiceMock.create).toHaveBeenCalledWith({
        googleId: 'google-123',
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
      });
      expect(result).toEqual(mockAuthUser);
    });

    it('handles profile with no photos', async () => {
      const noPhotosProfile: GoogleProfile = {
        ...googleProfile,
        photos: [],
      };
      usersServiceMock.findByGoogleId.mockResolvedValue(null);
      const userNoAvatar = { ...mockUser, avatarUrl: null };
      usersServiceMock.create.mockResolvedValue(userNoAvatar);

      const result = await service.validateGoogleUser(noPhotosProfile);

      expect(usersServiceMock.create).toHaveBeenCalledWith(
        expect.objectContaining({ avatarUrl: null }),
      );
      expect(result.avatarUrl).toBeNull();
    });
  });

  describe('login', () => {
    it('returns a signed JWT token', () => {
      const token = service.login(mockAuthUser);
      expect(jwtServiceMock.sign).toHaveBeenCalledWith({ sub: 'user-1', email: 'test@example.com' });
      expect(token).toBe('signed-jwt-token');
    });
  });

  describe('getProfile', () => {
    it('returns auth user shape when user exists', async () => {
      usersServiceMock.findById.mockResolvedValue(mockUser);
      const result = await service.getProfile('user-1');
      expect(result).toEqual(mockAuthUser);
    });

    it('returns null when user does not exist', async () => {
      usersServiceMock.findById.mockResolvedValue(null);
      const result = await service.getProfile('missing');
      expect(result).toBeNull();
    });
  });
});
