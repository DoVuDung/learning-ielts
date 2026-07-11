import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  UpdateUserPremiumDto,
  ManualApproveTransactionDto,
  AdminCreateVideoDto,
} from './dto/admin.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const [totalUsers, premiumUsers, totalVideos, revenueAgg, recentTransactions] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({ where: { isPremium: true } }),
        this.prisma.video.count(),
        this.prisma.upgradeTransaction.aggregate({
          _sum: { amount: true },
          where: { status: 'SUCCESS' },
        }),
        this.prisma.upgradeTransaction.findMany({
          take: 8,
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        }),
      ]);

    return {
      totalUsers,
      premiumUsers,
      totalVideos,
      totalRevenue: revenueAgg._sum.amount ?? 0,
      recentTransactions,
    };
  }

  async getUsers(search?: string) {
    const where = search
      ? {
          OR: [
            { email: { contains: search, mode: 'insensitive' as const } },
            { name: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    return this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        isPremium: true,
        premiumExpiresAt: true,
        createdAt: true,
      },
    });
  }

  async updateUserPremium(userId: string, dto: UpdateUserPremiumDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    let expiresAt = user.premiumExpiresAt;
    if (dto.isPremium && dto.extendDays) {
      const baseDate =
        user.premiumExpiresAt && user.premiumExpiresAt > new Date()
          ? new Date(user.premiumExpiresAt)
          : new Date();
      expiresAt = new Date(baseDate.getTime() + dto.extendDays * 86400 * 1000);
    } else if (!dto.isPremium) {
      expiresAt = null;
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        isPremium: dto.isPremium,
        premiumExpiresAt: expiresAt,
      },
    });
  }

  async getTransactions() {
    return this.prisma.upgradeTransaction.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async approveTransaction(dto: ManualApproveTransactionDto) {
    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.upgradeTransaction.findUnique({
        where: { orderId: dto.orderId },
      });

      if (!transaction) {
        throw new NotFoundException(`Order ${dto.orderId} not found`);
      }

      if (transaction.status === 'SUCCESS') {
        return { transaction, idempotent: true };
      }

      const updatedTx = await tx.upgradeTransaction.update({
        where: { orderId: dto.orderId },
        data: { status: 'SUCCESS' },
      });

      const user = await tx.user.findUnique({
        where: { id: transaction.userId },
      });

      const baseDate =
        user?.premiumExpiresAt && user.premiumExpiresAt > new Date()
          ? new Date(user.premiumExpiresAt)
          : new Date();
      const newExpiresAt = new Date(
        baseDate.getTime() + transaction.durationDays * 86400 * 1000,
      );

      await tx.user.update({
        where: { id: transaction.userId },
        data: {
          isPremium: true,
          premiumExpiresAt: newExpiresAt,
        },
      });

      return { transaction: updatedTx, idempotent: false };
    });
  }

  async getVideos() {
    return this.prisma.video.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { sentences: true },
        },
      },
    });
  }

  async createVideo(dto: AdminCreateVideoDto) {
    const adminUser = await this.prisma.user.findFirst();
    return this.prisma.video.create({
      data: {
        youtubeId: dto.youtubeId,
        title: dto.title,
        thumbnailUrl: `https://i.ytimg.com/vi/${dto.youtubeId}/hqdefault.jpg`,
        duration: 180,
        category: dto.category,
        level: dto.level,
        createdById: adminUser?.id ?? 'admin-system',
      },
    });
  }
}
