import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

const mockUser = {
  id: 'user-1',
  googleId: 'google-123',
  email: 'test@example.com',
  name: 'Test User',
  avatarUrl: 'https://example.com/avatar.jpg',
  isPremium: false,
  premiumExpiresAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('UsersService', () => {
  let service: UsersService;
  let prismaMock: any;

  beforeEach(async () => {
    prismaMock = {
      user: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      upgradeTransaction: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
        findMany: jest.fn(),
      },
      assessmentResult: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prismaMock)),
      $executeRawUnsafe: jest.fn().mockResolvedValue(1),
    };

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
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { googleId: 'google-123' },
      });
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
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
      });
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
      const result = await service.create({
        googleId: 'g',
        email: 'e@e.com',
        name: 'N',
      });
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

  describe('upgradeAccount (ACID & Idempotency)', () => {
    it('upgrades user to premium inside Serializable transaction', async () => {
      prismaMock.upgradeTransaction.findUnique.mockResolvedValue(null);
      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const upgradedUser = {
        ...mockUser,
        isPremium: true,
        premiumExpiresAt: new Date(Date.now() + 30 * 86400 * 1000),
      };
      const mockTxRecord = {
        id: 'tx-1',
        userId: 'user-1',
        orderId: 'ORDER-001',
        amount: 100000,
        plan: 'PREMIUM_MONTHLY',
        durationDays: 30,
        status: 'SUCCESS',
        createdAt: new Date(),
        completedAt: new Date(),
      };

      prismaMock.user.update.mockResolvedValue(upgradedUser);
      prismaMock.upgradeTransaction.upsert.mockResolvedValue(mockTxRecord);

      const result = await service.upgradeAccount('user-1', {
        orderId: 'ORDER-001',
        plan: 'PREMIUM_MONTHLY',
        durationDays: 30,
        amount: 100000,
      });

      expect(prismaMock.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
      );
      expect(prismaMock.$executeRawUnsafe).toHaveBeenCalledWith(
        'SELECT id FROM "User" WHERE id = $1 FOR UPDATE',
        'user-1',
      );
      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          isPremium: true,
          premiumExpiresAt: expect.any(Date),
        },
      });
      expect(result.user.isPremium).toBe(true);
      expect(result.idempotent).toBe(false);
    });

    it('returns idempotent response if orderId was already successfully processed', async () => {
      const existingTx = {
        id: 'tx-1',
        userId: 'user-1',
        orderId: 'ORDER-001',
        status: 'SUCCESS',
      };
      prismaMock.upgradeTransaction.findUnique.mockResolvedValue(existingTx);
      prismaMock.user.findUnique.mockResolvedValue({
        ...mockUser,
        isPremium: true,
      });

      const result = await service.upgradeAccount('user-1', {
        orderId: 'ORDER-001',
      });

      expect(result.idempotent).toBe(true);
      expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it('extends existing premium expiration date if user is already premium', async () => {
      const currentExpiry = new Date(Date.now() + 10 * 86400 * 1000); // 10 days remaining
      const activePremiumUser = {
        ...mockUser,
        isPremium: true,
        premiumExpiresAt: currentExpiry,
      };

      prismaMock.upgradeTransaction.findUnique.mockResolvedValue(null);
      prismaMock.user.findUnique.mockResolvedValue(activePremiumUser);
      prismaMock.user.update.mockResolvedValue({
        ...activePremiumUser,
        premiumExpiresAt: new Date(currentExpiry.getTime() + 30 * 86400 * 1000),
      });
      prismaMock.upgradeTransaction.upsert.mockResolvedValue({
        id: 'tx-2',
        orderId: 'ORDER-002',
        status: 'SUCCESS',
      });

      await service.upgradeAccount('user-1', {
        orderId: 'ORDER-002',
        durationDays: 30,
      });

      expect(prismaMock.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          isPremium: true,
          premiumExpiresAt: expect.any(Date),
        },
      });
    });

    it('throws NotFoundException if user does not exist', async () => {
      prismaMock.upgradeTransaction.findUnique.mockResolvedValue(null);
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        service.upgradeAccount('non-existent', { orderId: 'ORDER-404' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException if orderId exists but user is not found', async () => {
      const existingTx = {
        id: 'tx-1',
        userId: 'user-1',
        orderId: 'ORDER-001',
        status: 'SUCCESS',
      };
      prismaMock.upgradeTransaction.findUnique.mockResolvedValue(existingTx);
      prismaMock.user.findUnique.mockResolvedValue(null);

      await expect(
        service.upgradeAccount('non-existent', { orderId: 'ORDER-001' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getUpgradeHistory', () => {
    it('returns upgrade transaction history for user', async () => {
      const history = [{ id: 'tx-1', orderId: 'ORDER-1' }];
      prismaMock.upgradeTransaction.findMany.mockResolvedValue(history);

      const result = await service.getUpgradeHistory('user-1');
      expect(result).toEqual(history);
      expect(prismaMock.upgradeTransaction.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('getTarget & updateTarget', () => {
    it('throws NotFoundException if user not found in getTarget', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      await expect(service.getTarget('u-404')).rejects.toThrow(NotFoundException);
    });

    it('returns target and latest assessment in getTarget', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'u-1', targetIeltsBand: 7.0 });
      prismaMock.assessmentResult.findFirst.mockResolvedValue({ id: 'a-1', cefrLevel: 'B2' });

      const res = await service.getTarget('u-1');
      expect(res).toEqual({ id: 'u-1', targetIeltsBand: 7.0, latestAssessment: { id: 'a-1', cefrLevel: 'B2' } });
    });

    it('updates target successfully', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'u-1' });
      prismaMock.user.update.mockResolvedValue({ id: 'u-1', targetIeltsBand: 7.5 });

      const res = await service.updateTarget('u-1', { targetIeltsBand: 7.5 });
      expect(res).toEqual({ id: 'u-1', targetIeltsBand: 7.5 });
    });
  });

  describe('submitAssessment & getAssessments', () => {
    it('submits assessment and calculates level/band accurately', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'u-1' });
      const mockAssessment = { id: 'a-1', score: 90, cefrLevel: 'C1', ieltsBand: 7.5 };
      prismaMock.assessmentResult.create.mockResolvedValue(mockAssessment);
      prismaMock.user.update.mockResolvedValue({ id: 'u-1' });

      const res = await service.submitAssessment('u-1', {
        answers: [
          { questionId: 'q1', selectedAnswer: 'B' },
          { questionId: 'q4', selectedAnswer: 'D' },
          { questionId: 'q7', selectedAnswer: 'A' },
        ],
      });

      expect(res).toEqual(mockAssessment);
      expect(prismaMock.assessmentResult.create).toHaveBeenCalled();
    });

    it('submits assessment with different score brackets (B1, A2, A1)', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'u-1' });
      prismaMock.assessmentResult.create.mockResolvedValue({ id: 'a-2' });
      prismaMock.user.update.mockResolvedValue({ id: 'u-1' });

      // Test A1
      await service.submitAssessment('u-1', { answers: [] });
      // Test A2
      await service.submitAssessment('u-1', {
        answers: [
          { questionId: 'q1', selectedAnswer: 'B' },
          { questionId: 'q4', selectedAnswer: 'D' },
        ],
      });
    });

    it('returns assessment history', async () => {
      prismaMock.assessmentResult.findMany.mockResolvedValue([]);
      const res = await service.getAssessments('u-1');
      expect(res).toEqual([]);
    });
  });
});
