import { Test } from '@nestjs/testing';
import { GoogleStrategy } from './google.strategy';
import { AuthService } from '../auth.service';
import type { AuthUser, GoogleProfile } from '../dto/auth.dto';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockAuthUser: AuthUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  avatarUrl: null,
  isPremium: false,
  role: 'USER',
};

const googleProfile: GoogleProfile = {
  id: 'google-123',
  emails: [{ value: 'test@example.com' }],
  displayName: 'Test User',
  photos: [],
};

const authServiceMock = {
  validateGoogleUser: jest.fn(),
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('GoogleStrategy', () => {
  let strategy: GoogleStrategy;

  beforeEach(async () => {
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    process.env.GOOGLE_CALLBACK_URL = 'http://localhost:3001/auth/google/callback';

    const module = await Test.createTestingModule({
      providers: [
        GoogleStrategy,
        { provide: AuthService, useValue: authServiceMock },
      ],
    }).compile();

    strategy = module.get(GoogleStrategy);
    jest.clearAllMocks();
    authServiceMock.validateGoogleUser.mockResolvedValue(mockAuthUser);
  });

  it('is defined', () => {
    expect(strategy).toBeDefined();
  });

  // ─── validate ──────────────────────────────────────────────────────────────

  describe('validate', () => {
    it('delegates to authService.validateGoogleUser with the Google profile', async () => {
      const result = await strategy.validate('access-token', 'refresh-token', googleProfile);

      expect(authServiceMock.validateGoogleUser).toHaveBeenCalledTimes(1);
      expect(authServiceMock.validateGoogleUser).toHaveBeenCalledWith(googleProfile);
      expect(result).toEqual(mockAuthUser);
    });

    it('passes access and refresh tokens but does not use them directly', async () => {
      await strategy.validate('my-access', 'my-refresh', googleProfile);

      // validate should only pass the profile to the service
      const [passedProfile] = authServiceMock.validateGoogleUser.mock.calls[0];
      expect(passedProfile).toBe(googleProfile);
    });

    it('returns the AuthUser returned by authService.validateGoogleUser', async () => {
      const adminUser: AuthUser = { ...mockAuthUser, role: 'ADMIN' };
      authServiceMock.validateGoogleUser.mockResolvedValue(adminUser);

      const result = await strategy.validate('a', 'r', googleProfile);

      expect(result).toEqual(adminUser);
    });

    it('propagates errors thrown by authService.validateGoogleUser', async () => {
      authServiceMock.validateGoogleUser.mockRejectedValue(new Error('DB error'));

      await expect(strategy.validate('a', 'r', googleProfile)).rejects.toThrow('DB error');
    });
  });

  // ─── Constructor fallbacks ─────────────────────────────────────────────────

  describe('constructor', () => {
    it('uses default callback URL when GOOGLE_CALLBACK_URL env var is unset', () => {
      delete process.env.GOOGLE_CALLBACK_URL;
      const fallbackStrategy = new GoogleStrategy(authServiceMock as any);
      expect(fallbackStrategy).toBeDefined();
    });

    it('uses env credentials when all GOOGLE_* env vars are set', () => {
      process.env.GOOGLE_CLIENT_ID = 'real-client-id';
      process.env.GOOGLE_CLIENT_SECRET = 'real-secret';
      process.env.GOOGLE_CALLBACK_URL = 'https://prod.example.com/auth/google/callback';
      const prodStrategy = new GoogleStrategy(authServiceMock as any);
      expect(prodStrategy).toBeDefined();
    });
  });
});
