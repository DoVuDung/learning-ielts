import { Test } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import type { AuthUser } from './dto/auth.dto';
import type { Response } from 'express';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockAuthUser: AuthUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  avatarUrl: 'https://example.com/avatar.jpg',
  isPremium: false,
  role: 'USER',
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

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('AuthController', () => {
  let controller: AuthController;
  let origFrontendUrl: string | undefined;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authServiceMock }],
    }).compile();

    controller = module.get(AuthController);
    jest.clearAllMocks();
    authServiceMock.login.mockReturnValue('mocked-jwt-token');
    origFrontendUrl = process.env.FRONTEND_URL;
  });

  afterEach(() => {
    if (origFrontendUrl === undefined) {
      delete process.env.FRONTEND_URL;
    } else {
      process.env.FRONTEND_URL = origFrontendUrl;
    }
  });

  // ─── googleAuth ────────────────────────────────────────────────────────────

  describe('googleAuth', () => {
    it('is defined (guard handles redirect; method body is empty)', () => {
      expect(controller.googleAuth).toBeDefined();
      expect(controller.googleAuth()).toBeUndefined();
    });
  });

  // ─── googleCallback ────────────────────────────────────────────────────────

  describe('googleCallback', () => {
    it('calls authService.login with req.user and redirects with token', () => {
      process.env.FRONTEND_URL = 'http://localhost:3000';
      const req: any = { user: mockAuthUser };
      const res = makeResponse() as any;

      controller.googleCallback(req, res);

      expect(authServiceMock.login).toHaveBeenCalledTimes(1);
      expect(authServiceMock.login).toHaveBeenCalledWith(mockAuthUser);
      expect(res.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/auth/callback?token=mocked-jwt-token',
      );
    });

    it('does NOT set any cookie (Bearer-only flow)', () => {
      process.env.FRONTEND_URL = 'http://localhost:3000';
      const req: any = { user: mockAuthUser };
      const res = makeResponse() as any;

      controller.googleCallback(req, res);

      expect(res.cookie).not.toHaveBeenCalled();
    });

    it('falls back to http://localhost:3000 when FRONTEND_URL is unset', () => {
      delete process.env.FRONTEND_URL;
      const req: any = { user: mockAuthUser };
      const res = makeResponse() as any;

      controller.googleCallback(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/auth/callback?token=mocked-jwt-token',
      );
    });

    it('uses first origin as default when FRONTEND_URL has multiple values', () => {
      process.env.FRONTEND_URL = 'https://prod.example.com,http://localhost:3000';
      const req: any = { user: mockAuthUser };
      const res = makeResponse() as any;

      controller.googleCallback(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        'https://prod.example.com/auth/callback?token=mocked-jwt-token',
      );
    });

    it('resolves frontend URL from query state when it matches an allowed origin', () => {
      process.env.FRONTEND_URL =
        'http://localhost:3000,https://bap-english.vercel.app/';
      const req: any = {
        user: mockAuthUser,
        query: { state: 'https://bap-english.vercel.app' },
      };
      const res = makeResponse() as any;

      controller.googleCallback(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        'https://bap-english.vercel.app/auth/callback?token=mocked-jwt-token',
      );
    });

    it('resolves frontend URL from state that starts with an allowed origin', () => {
      process.env.FRONTEND_URL = 'https://bap-english.vercel.app,http://localhost:3000';
      const req: any = {
        user: mockAuthUser,
        query: { state: 'https://bap-english.vercel.app/some/path' },
      };
      const res = makeResponse() as any;

      controller.googleCallback(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        'https://bap-english.vercel.app/auth/callback?token=mocked-jwt-token',
      );
    });

    it('falls back to default origin when state does not match any allowed origin (SSRF protection)', () => {
      process.env.FRONTEND_URL =
        'https://bap-english.vercel.app,http://localhost:3000';
      const req: any = {
        user: mockAuthUser,
        query: { state: 'https://evil.com' },
      };
      const res = makeResponse() as any;

      controller.googleCallback(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        'https://bap-english.vercel.app/auth/callback?token=mocked-jwt-token',
      );
    });

    it('handles empty state gracefully', () => {
      process.env.FRONTEND_URL = 'http://localhost:3000';
      const req: any = {
        user: mockAuthUser,
        query: { state: '' },
      };
      const res = makeResponse() as any;

      controller.googleCallback(req, res);

      expect(res.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/auth/callback?token=mocked-jwt-token',
      );
    });

    it('handles non-string state (e.g. array) gracefully', () => {
      process.env.FRONTEND_URL = 'http://localhost:3000';
      const req: any = {
        user: mockAuthUser,
        query: { state: ['https://evil.com', 'https://also-evil.com'] },
      };
      const res = makeResponse() as any;

      controller.googleCallback(req, res);

      // Non-string state is ignored; falls back to default
      expect(res.redirect).toHaveBeenCalledWith(
        'http://localhost:3000/auth/callback?token=mocked-jwt-token',
      );
    });
  });

  // ─── getProfile ────────────────────────────────────────────────────────────

  describe('getProfile', () => {
    it('returns the AuthUser attached to the request', () => {
      const req: any = { user: mockAuthUser };
      const result = controller.getProfile(req);
      expect(result).toEqual(mockAuthUser);
    });

    it('returns exactly the user object reference from req.user', () => {
      const req: any = { user: mockAuthUser };
      expect(controller.getProfile(req)).toBe(mockAuthUser);
    });
  });

  // ─── logout ────────────────────────────────────────────────────────────────

  describe('logout', () => {
    it('returns a success message via res.json', () => {
      const res = makeResponse() as any;
      controller.logout(res);
      expect(res.json).toHaveBeenCalledWith({ message: 'Logged out successfully' });
    });

    it('does NOT clear any cookie (Bearer-only flow)', () => {
      const res = makeResponse() as any;
      controller.logout(res);
      expect(res.clearCookie).not.toHaveBeenCalled();
    });

    it('does NOT call redirect on logout', () => {
      const res = makeResponse() as any;
      controller.logout(res);
      expect(res.redirect).not.toHaveBeenCalled();
    });
  });
});
