import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { UsersService } from '../../users/users.service';

const mockUser = {
  id: 'user-1',
  googleId: 'google-123',
  email: 'test@example.com',
  name: 'Test User',
  avatarUrl: null,
  isPremium: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const usersServiceMock = {
  findById: jest.fn(),
};

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;

  beforeEach(async () => {
    process.env.JWT_SECRET = 'test-secret';

    const module = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: UsersService, useValue: usersServiceMock },
      ],
    }).compile();
    strategy = module.get(JwtStrategy);
    jest.clearAllMocks();
  });

  it('is defined', () => {
    expect(strategy).toBeDefined();
  });

  it('validate returns user when user exists', async () => {
    usersServiceMock.findById.mockResolvedValue(mockUser);
    const result = await strategy.validate({ sub: 'user-1', email: 'test@example.com' });
    expect(result).toEqual({ ...mockUser, role: 'USER' });
  });

  it('validate returns ADMIN role when user email is in admin emails', async () => {
    usersServiceMock.findById.mockResolvedValue({
      ...mockUser,
      email: 'vudungoik2016@gmail.com',
    });
    const result = await strategy.validate({
      sub: 'user-1',
      email: 'vudungoik2016@gmail.com',
    });
    expect(result.role).toBe('ADMIN');
  });

  it('validate throws UnauthorizedException when user not found', async () => {
    usersServiceMock.findById.mockResolvedValue(null);
    await expect(strategy.validate({ sub: 'missing', email: 'x@x.com' })).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('extracts token from Authorization Bearer header', () => {
    const extractor = (strategy as any)._jwtFromRequest;
    if (extractor) {
      expect(
        extractor({
          headers: { authorization: 'Bearer test-token' },
        }),
      ).toBe('test-token');
      expect(extractor({ headers: {} })).toBeNull();
    }
  });
});
