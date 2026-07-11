import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as cookieParser from 'cookie-parser';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { AuthService } from '../src/auth/auth.service';
import { UsersService } from '../src/users/users.service';
import { PrismaService } from '../src/prisma/prisma.service';

const mockUser = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  avatarUrl: null,
  role: 'USER',
  isPremium: false,
  googleId: 'google-123',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const authUserPayload = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  avatarUrl: null,
  isPremium: false,
  role: 'USER',
};

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let usersService: UsersService;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({
        user: {
          findUnique: jest.fn(),
          create: jest.fn(),
          update: jest.fn(),
        },
        $connect: jest.fn(),
        $disconnect: jest.fn(),
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    await app.init();

    authService = moduleRef.get(AuthService);
    usersService = moduleRef.get(UsersService);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /auth/google', () => {
    it('redirects to Google OAuth (302)', async () => {
      // The guard redirects to Google; in test it returns 302
      const res = await request(app.getHttpServer())
        .get('/auth/google')
        .expect(302);
      expect(res.headers.location).toMatch(/accounts\.google\.com/);
    });
  });

  describe('GET /auth/me (protected)', () => {
    it('returns 401 when no token provided', async () => {
      await request(app.getHttpServer()).get('/auth/me').expect(401);
    });

    it('returns user profile with valid JWT cookie', async () => {
      // Issue a real token via the service
      jest.spyOn(usersService, 'findById').mockResolvedValue(mockUser as any);
      const token = authService.login(authUserPayload);

      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', `access_token=${token}`)
        .expect(200);

      expect(res.body).toMatchObject({
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
      });
    });

    it('returns user profile with Bearer token', async () => {
      jest.spyOn(usersService, 'findById').mockResolvedValue(mockUser as any);
      const token = authService.login(authUserPayload);

      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.email).toBe('test@example.com');
    });

    it('returns 401 with an invalid token', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', 'access_token=not-a-real-token')
        .expect(401);
    });

    it('returns 401 when JWT user is not in database', async () => {
      jest.spyOn(usersService, 'findById').mockResolvedValue(null);
      const token = authService.login(authUserPayload);

      await request(app.getHttpServer())
        .get('/auth/me')
        .set('Cookie', `access_token=${token}`)
        .expect(401);
    });
  });

  describe('GET /auth/logout', () => {
    it('clears the cookie and returns success message', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/logout')
        .expect(200);

      expect(res.body.message).toBe('Logged out successfully');
      const cookieHeader = res.headers['set-cookie'];
      const clearedCookie = Array.isArray(cookieHeader)
        ? cookieHeader.find((c: string) => c.startsWith('access_token=;'))
        : cookieHeader;
      expect(clearedCookie).toBeDefined();
    });
  });
});
