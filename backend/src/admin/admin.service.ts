import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '../auth/roles.enum';
import { parseLlmNoteText } from '../words/llm-note.parser';
import {
  UpdateUserPremiumDto,
  ManualApproveTransactionDto,
  AdminCreateVideoDto,
  AdminUpdateVideoDto,
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
        role: true,
        isPremium: true,
        premiumExpiresAt: true,
        createdAt: true,
      },
    });
  }

  async updateUserRole(userId: string, role: Role) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { role },
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

  async updateVideo(id: string, dto: AdminUpdateVideoDto) {
    const video = await this.prisma.video.findUnique({ where: { id } });
    if (!video) {
      throw new NotFoundException(`Video with ID ${id} not found`);
    }
    return this.prisma.video.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.category && { category: dto.category }),
        ...(dto.level && { level: dto.level }),
      },
    });
  }

  async deleteVideo(id: string) {
    const video = await this.prisma.video.findUnique({ where: { id } });
    if (!video) {
      throw new NotFoundException(`Video with ID ${id} not found`);
    }
    await this.prisma.sentence.deleteMany({ where: { videoId: id } });
    await this.prisma.video.delete({ where: { id } });
    return { ok: true, message: `Video ${id} deleted successfully` };
  }

  async deleteUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    await this.prisma.user.delete({ where: { id: userId } });
    return { ok: true, message: `User ${userId} deleted successfully` };
  }

  async importLlmNotesForUser(
    targetUserId: string,
    payload: {
      rawText?: string;
      notes?: Array<{
        word: string;
        definition?: string;
        context?: string;
        tags?: string[];
      }>;
    },
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: targetUserId } });
    if (!user) {
      throw new NotFoundException(`User with ID ${targetUserId} not found`);
    }

    let items = payload.notes ?? [];
    if (payload.rawText && payload.rawText.trim()) {
      const parsed = parseLlmNoteText(payload.rawText);
      items = [...items, ...parsed];
    }

    if (!items || items.length === 0) {
      throw new BadRequestException('No valid notes found to import');
    }

    const savedNotes: any[] = [];
    for (const item of items) {
      if (!item.word || !item.word.trim()) continue;
      const normalized = item.word.toLowerCase().trim();

      const note = await this.prisma.note.upsert({
        where: { userId_word: { userId: targetUserId, word: normalized } },
        update: {
          ...(item.definition && { definition: item.definition }),
          ...(item.context && { context: item.context }),
          ...(item.tags && { tags: item.tags }),
        },
        create: {
          userId: targetUserId,
          word: normalized,
          definition: item.definition,
          context: item.context,
          tags: item.tags ?? ['LLM Note'],
          cards: {
            create: [
              { userId: targetUserId, template: 'WORD_TO_MEANING' },
              { userId: targetUserId, template: 'MEANING_TO_WORD' },
              { userId: targetUserId, template: 'LISTENING' },
            ],
          },
        },
        include: { cards: true },
      });
      savedNotes.push(note);
    }

    return {
      success: true,
      importedCount: savedNotes.length,
      notes: savedNotes,
    };
  }
}
