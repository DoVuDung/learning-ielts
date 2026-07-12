import { Test } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import type { AuthUser } from './dto/auth.dto';
import type { Response } from 'express';

const mockAuthUser: AuthUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  avatarUrl: 'https://example.com/avatar.jpg',
  isPremium: false,
};

const authServiceMock = {
  login: jest.fn().mockReturnValue('mocked-jwt-token'),
};

function makeResponse(): jest.Mocked<Partial<Response>> {
  const res: any = {};
  res.cookie = jest.fn().mockReturnValue(res);
  res.redirect = jest.fn().mockReturnValue(res);
  res.clearCookie = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authServiceMock }],
    }).compile();
    controller = module.get(AuthController);
    jest.clearAllMocks();
    authServiceMock.login.mockReturnValue('mocked-jwt-token');
  });

  describe('googleAuth', () => {
    it('is defined (guard handles redirect; method body is empty)', () => {
      expect(controller.googleAuth).toBeDefined();
      expect(controller.googleAuth()).toBeUndefined();
    });
  });

  describe('googleCallback', () => {
    it('signs token, sets cookie, and redirects to frontend', () => {
      const req: any = { user: mockAuthUser };
      const res = makeResponse() as any;
      const origEnv = process.env.FRONTEND_URL;
      process.env.FRONTEND_URL = 'http://localhost:3000';

      controller.googleCallback(req, res);

      expect(authServiceMock.login).toHaveBeenCalledWith(mockAuthUser);
      expect(res.cookie).toHaveBeenCalledWith(
        'access_token',
        'mocked-jwt-token',
        expect.objectContaining({ httpOnly: true }),
      );
      expect(res.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/auth/callback?token=mocked-jwt-token',
      );
      process.env.FRONTEND_URL = origEnv;
    });

    it('uses default FRONTEND_URL when env var is not set', () => {
      const req: any = { user: mockAuthUser };
      const res = makeResponse() as any;
      const origEnv = process.env.FRONTEND_URL;
      delete process.env.FRONTEND_URL;

      controller.googleCallback(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/auth/callback?token=mocked-jwt-token',
      );
      process.env.FRONTEND_URL = origEnv;
    });

    it('resolves frontend url from state when multiple origins are allowed', () => {
      const req: any = {
        user: mockAuthUser,
        query: { state: 'https://bap-english.vercel.app' },
      };
      const res = makeResponse() as any;
      const origEnv = process.env.FRONTEND_URL;
      process.env.FRONTEND_URL =
        'http://localhost:3000,https://bap-english.vercel.app/';

      controller.googleCallback(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        'https://bap-english.vercel.app/auth/callback?token=mocked-jwt-token',
      );
      process.env.FRONTEND_URL = origEnv;
    });

    it('falls back to default origin when state does not match allowed origins', () => {
      const req: any = {
        user: mockAuthUser,
        query: { state: 'https://evil.com' },
      };
      const res = makeResponse() as any;
      const origEnv = process.env.FRONTEND_URL;
      process.env.FRONTEND_URL =
        'https://bap-english.vercel.app,http://localhost:3000';

      controller.googleCallback(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        'https://bap-english.vercel.app/auth/callback?token=mocked-jwt-token',
      );
      process.env.FRONTEND_URL = origEnv;
    });
  });

  describe('getProfile', () => {
    it('returns the user attached to the request', () => {
      const req: any = { user: mockAuthUser };
      const result = controller.getProfile(req);
      expect(result).toEqual(mockAuthUser);
    });
  });

  describe('logout', () => {
    it('clears the access_token cookie and returns success message', () => {
      const res = makeResponse() as any;
      controller.logout(res);
      expect(res.clearCookie).toHaveBeenCalledWith('access_token');
      expect(res.json).toHaveBeenCalledWith({ message: 'Logged out successfully' });
    });
  });
});
