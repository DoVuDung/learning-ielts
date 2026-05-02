import { Test } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

const mockUser = {
  id: 'user-1',
  googleId: 'google-123',
  email: 'test@example.com',
  name: 'Test User',
  avatarUrl: 'https://example.com/avatar.jpg',
  isPremium: false,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const prismaMock = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

describe('UsersService', () => {
  let service: UsersService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();
    service = module.get(UsersService);
    jest.clearAllMocks();
  });

  describe('findByGoogleId', () => {
    it('returns the user when found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      const result = await service.findByGoogleId('google-123');
      expect(result).toEqual(mockUser);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { googleId: 'google-123' } });
    });

    it('returns null when not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      const result = await service.findByGoogleId('missing');
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('returns the user when found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(mockUser);
      const result = await service.findById('user-1');
      expect(result).toEqual(mockUser);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-1' } });
    });

    it('returns null when not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      const result = await service.findById('missing');
      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('creates and returns the new user', async () => {
      prismaMock.user.create.mockResolvedValue(mockUser);
      const dto = {
        googleId: 'google-123',
        email: 'test@example.com',
        name: 'Test User',
        avatarUrl: 'https://example.com/avatar.jpg',
      };
      const result = await service.create(dto);
      expect(result).toEqual(mockUser);
      expect(prismaMock.user.create).toHaveBeenCalledWith({ data: dto });
    });

    it('creates a user without avatarUrl', async () => {
      const noAvatar = { ...mockUser, avatarUrl: null };
      prismaMock.user.create.mockResolvedValue(noAvatar);
      const result = await service.create({ googleId: 'g', email: 'e@e.com', name: 'N' });
      expect(result.avatarUrl).toBeNull();
    });
  });

  describe('update', () => {
    it('updates and returns the user', async () => {
      const updated = { ...mockUser, name: 'Updated Name' };
      prismaMock.user.update.mockResolvedValue(updated);
      const result = await service.update('user-1', { name: 'Updated Name' });
      expect(result.name).toBe('Updated Name');
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: { name: 'Updated Name' },
      });
    });
  });
});
