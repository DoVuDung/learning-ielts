import { ExecutionContext } from '@nestjs/common';
import { GoogleAuthGuard } from './google-auth.guard';

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('GoogleAuthGuard', () => {
  let guard: GoogleAuthGuard;

  beforeEach(() => {
    guard = new GoogleAuthGuard();
  });

  it('is instantiable', () => {
    expect(guard).toBeDefined();
  });

  it('extends AuthGuard("google")', () => {
    const { AuthGuard } = require('@nestjs/passport');
    expect(guard).toBeInstanceOf(AuthGuard('google'));
  });

  // ─── getAuthenticateOptions ───────────────────────────────────────────────

  describe('getAuthenticateOptions', () => {
    function mockContext(query: Record<string, any>): ExecutionContext {
      return {
        switchToHttp: () => ({
          getRequest: () => ({ query }),
        }),
      } as any;
    }

    it('returns state from query when state is present', () => {
      const ctx = mockContext({ state: 'https://bap-english.vercel.app' });
      expect(guard.getAuthenticateOptions(ctx)).toEqual({
        state: 'https://bap-english.vercel.app',
      });
    });

    it('returns undefined state when query has no state key', () => {
      const ctx = mockContext({});
      expect(guard.getAuthenticateOptions(ctx)).toEqual({ state: undefined });
    });

    it('returns undefined state when request has no query object', () => {
      const ctx: any = {
        switchToHttp: () => ({
          getRequest: () => ({}),
        }),
      };
      expect(guard.getAuthenticateOptions(ctx)).toEqual({ state: undefined });
    });

    it('passes multiple allowed origins state string through unchanged', () => {
      const state = 'https://prod.example.com';
      const ctx = mockContext({ state });
      expect(guard.getAuthenticateOptions(ctx)).toEqual({ state });
    });
  });
});
