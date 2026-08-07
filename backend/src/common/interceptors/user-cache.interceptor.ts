import { Injectable, ExecutionContext } from '@nestjs/common';
import { CacheInterceptor } from '@nestjs/cache-manager';

@Injectable()
export class UserCacheInterceptor extends CacheInterceptor {
  trackBy(context: ExecutionContext): string | undefined {
    const request = context.switchToHttp().getRequest();
    // Cache only GET requests
    if (request.method !== 'GET') {
      return undefined;
    }

    const url = request.url;
    // For protected routes, use the user's sub (ID) to scope the cache.
    // For public routes, request.user might be undefined.
    const userId = request.user?.sub || 'public';

    return `${url}-${userId}`;
  }
}
