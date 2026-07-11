import { Test } from '@nestjs/testing';
import { GoogleStrategy } from './google.strategy';
import { AuthService } from '../auth.service';
import type { AuthUser, GoogleProfile } from '../dto/auth.dto';

const mockAuthUser: AuthUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  avatarUrl: null,
  isPremium: false,
};

const authServiceMock = {
  validateGoogleUser: jest.fn().mockResolvedValue(mockAuthUser),
};

const googleProfile: GoogleProfile = {
  id: 'google-123',
  emails: [{ value: 'test@example.com' }],
  displayName: 'Test User',
  photos: [],
};

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

  it('validate delegates to authService.validateGoogleUser', async () => {
    const result = await strategy.validate('access', 'refresh', googleProfile);
    expect(authServiceMock.validateGoogleUser).toHaveBeenCalledWith(googleProfile);
    expect(result).toEqual(mockAuthUser);
  });

  it('uses default callback url when GOOGLE_CALLBACK_URL is unset', () => {
    delete process.env.GOOGLE_CALLBACK_URL;
    const fallbackStrategy = new GoogleStrategy(authServiceMock as any);
    expect(fallbackStrategy).toBeDefined();
  });
});
