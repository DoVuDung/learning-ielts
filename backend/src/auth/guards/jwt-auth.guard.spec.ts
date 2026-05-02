import { JwtAuthGuard } from './jwt-auth.guard';

describe('JwtAuthGuard', () => {
  it('is instantiable', () => {
    const guard = new JwtAuthGuard();
    expect(guard).toBeDefined();
  });
});
