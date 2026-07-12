import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  it('is instantiable', () => {
    const guard = new JwtAuthGuard();
    expect(guard).toBeDefined();
  });

  it('extends AuthGuard("jwt")', () => {
    const { AuthGuard } = require('@nestjs/passport');
    const guard = new JwtAuthGuard();
    expect(guard).toBeInstanceOf(AuthGuard('jwt'));
  });
});
