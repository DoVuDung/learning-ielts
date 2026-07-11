import { Test, TestingModule } from '@nestjs/testing';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('AdminService', () => {
  let service: AdminService;
  let prisma: PrismaService;

  const mockPrisma = {
    user: {
      count: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    video: {
      count: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    upgradeTransaction: {
      aggregate: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<AdminService>(AdminService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  describe('getDashboardStats', () => {
    it('returns dashboard statistics and recent transactions', async () => {
      mockPrisma.user.count
        .mockResolvedValueOnce(100)
        .mockResolvedValueOnce(20);
      mockPrisma.video.count.mockResolvedValue(50);
      mockPrisma.upgradeTransaction.aggregate.mockResolvedValue({
        _sum: { amount: 5000000 },
      });
      const recentTxs = [{ id: 'tx-1' }];
      mockPrisma.upgradeTransaction.findMany.mockResolvedValue(recentTxs);

      const result = await service.getDashboardStats();

      expect(result).toEqual({
        totalUsers: 100,
        premiumUsers: 20,
        totalVideos: 50,
        totalRevenue: 5000000,
        recentTransactions: recentTxs,
      });
    });
  });

  describe('getUsers', () => {
    it('queries users with optional search filter', async () => {
      const mockUsers = [{ id: 'u-1', email: 'test@example.com' }];
      mockPrisma.user.findMany.mockResolvedValue(mockUsers);

      const result = await service.getUsers('test');

      expect(result).toEqual(mockUsers);
      expect(mockPrisma.user.findMany).toHaveBeenCalled();
    });

    it('queries users without search filter', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      await expect(service.getUsers()).resolves.toEqual([]);
    });
  });

  describe('updateUserPremium', () => {
    it('throws NotFoundException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(
        service.updateUserPremium('u-404', { isPremium: true, extendDays: 30 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates user premium status and extends expiration from existing future date', async () => {
      const futureDate = new Date(Date.now() + 86400 * 1000 * 10);
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-1',
        isPremium: true,
        premiumExpiresAt: futureDate,
      });
      mockPrisma.user.update.mockResolvedValue({
        id: 'u-1',
        isPremium: true,
      });

      const result = await service.updateUserPremium('u-1', {
        isPremium: true,
        extendDays: 30,
      });

      expect(result).toEqual({ id: 'u-1', isPremium: true });
      expect(mockPrisma.user.update).toHaveBeenCalled();
    });

    it('clears expiration if isPremium set to false', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u-1',
        isPremium: true,
      });
      mockPrisma.user.update.mockResolvedValue({
        id: 'u-1',
        isPremium: false,
      });

      await service.updateUserPremium('u-1', { isPremium: false });

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: 'u-1' },
        data: { isPremium: false, premiumExpiresAt: null },
      });
    });
  });

  describe('getTransactions', () => {
    it('returns list of transactions', async () => {
      mockPrisma.upgradeTransaction.findMany.mockResolvedValue([]);
      await expect(service.getTransactions()).resolves.toEqual([]);
    });
  });

  describe('approveTransaction', () => {
    it('throws NotFoundException if transaction not found', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          upgradeTransaction: { findUnique: jest.fn().mockResolvedValue(null) },
        });
      });
      await expect(
        service.approveTransaction({ orderId: '404' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns idempotent result if already SUCCESS', async () => {
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          upgradeTransaction: {
            findUnique: jest.fn().mockResolvedValue({
              orderId: 'ORD-1',
              status: 'SUCCESS',
            }),
          },
        });
      });
      const res = await service.approveTransaction({ orderId: 'ORD-1' });
      expect(res.idempotent).toBe(true);
    });

    it('executes transaction approval inside prisma.$transaction', async () => {
      const mockTx = {
        orderId: 'ORDER-1',
        userId: 'u-1',
        durationDays: 30,
        status: 'PENDING',
      };
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        const txPrisma = {
          upgradeTransaction: {
            findUnique: jest.fn().mockResolvedValue(mockTx),
            update: jest.fn().mockResolvedValue({ ...mockTx, status: 'SUCCESS' }),
          },
          user: {
            findUnique: jest.fn().mockResolvedValue({
              id: 'u-1',
              premiumExpiresAt: new Date(Date.now() + 86400 * 1000 * 5),
            }),
            update: jest.fn().mockResolvedValue({ id: 'u-1', isPremium: true }),
          },
        };
        return callback(txPrisma);
      });

      const result = await service.approveTransaction({ orderId: 'ORDER-1' });

      expect(result.idempotent).toBe(false);
      expect(result.transaction.status).toBe('SUCCESS');
    });
  });

  describe('getVideos & createVideo', () => {
    it('queries and creates videos', async () => {
      mockPrisma.video.findMany.mockResolvedValue([{ id: 'v-1' }]);
      mockPrisma.video.create.mockResolvedValue({ id: 'v-2' });

      await expect(service.getVideos()).resolves.toEqual([{ id: 'v-1' }]);
      await expect(
        service.createVideo({
          youtubeId: 'yt-1',
          title: 'Title',
          category: 'ielts',
          level: 'B2',
        }),
      ).resolves.toEqual({ id: 'v-2' });
    });
  });
});
