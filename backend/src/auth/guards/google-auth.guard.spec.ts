import { GoogleAuthGuard } from './google-auth.guard';

describe('GoogleAuthGuard', () => {
  it('is instantiable', () => {
    const guard = new GoogleAuthGuard();
    expect(guard).toBeDefined();
  });
});
