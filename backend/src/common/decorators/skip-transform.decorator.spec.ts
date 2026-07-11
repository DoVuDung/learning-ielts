import { SkipTransform, SKIP_TRANSFORM_KEY } from './skip-transform.decorator';

describe('SkipTransform decorator', () => {
  it('should return metadata with SKIP_TRANSFORM_KEY set to true', () => {
    const decorator = SkipTransform();
    expect(decorator).toBeDefined();
    expect(SKIP_TRANSFORM_KEY).toBe('skipTransform');
  });
});
