import { SetMetadata } from '@nestjs/common';

/**
 * Decorate a route handler to skip the global TransformInterceptor.
 * Use on streaming endpoints or redirects where wrapping is not applicable.
 *
 * @example
 * \@SkipTransform()
 * \@Get('google')
 * googleAuth() {}
 */
export const SKIP_TRANSFORM_KEY = 'skipTransform';
export const SkipTransform = () => SetMetadata(SKIP_TRANSFORM_KEY, true);
