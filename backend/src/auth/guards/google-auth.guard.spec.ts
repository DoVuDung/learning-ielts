import { GoogleAuthGuard } from './google-auth.guard';

describe('GoogleAuthGuard', () => {
  it('is instantiable', () => {
    const guard = new GoogleAuthGuard();
    expect(guard).toBeDefined();
  });

  it('extracts query state into authenticate options', () => {
    const guard = new GoogleAuthGuard();
    const mockContext: any = {
      switchToHttp: () => ({
        getRequest: () => ({ query: { state: 'https://bap-english.vercel.app' } }),
      }),
    };
    expect(guard.getAuthenticateOptions(mockContext)).toEqual({
      state: 'https://bap-english.vercel.app',
    });
  });

  it('handles missing query state gracefully', () => {
    const guard = new GoogleAuthGuard();
    const mockContext: any = {
      switchToHttp: () => ({
        getRequest: () => ({}),
      }),
    };
    expect(guard.getAuthenticateOptions(mockContext)).toEqual({
      state: undefined,
    });
  });
});
