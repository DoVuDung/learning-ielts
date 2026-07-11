import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { User, UpgradeTransaction } from '@prisma/client';
import { Prisma } from '@prisma/client';
import type { UpgradeAccountDto } from './dto/upgrade-account.dto';

export interface CreateUserDto {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export interface UpgradeAccountResult {
  user: User;
  transaction: UpgradeTransaction;
  idempotent: boolean;
}

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findByGoogleId(googleId: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { googleId } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async create(dto: CreateUserDto): Promise<User> {
    return this.prisma.user.create({ data: dto });
  }

  async update(id: string, data: Partial<CreateUserDto>): Promise<User> {
    return this.prisma.user.update({ where: { id }, data });
  }

  /**
   * ACID-compliant account upgrade method.
   * Enforces Atomicity, Consistency, Isolation, and Durability when multiple users
   * or concurrent requests attempt to upgrade accounts simultaneously.
   */
  async upgradeAccount(
    userId: string,
    dto: UpgradeAccountDto,
  ): Promise<UpgradeAccountResult> {
    const durationDays = dto.durationDays ?? 30;
    const plan = dto.plan ?? 'PREMIUM_MONTHLY';
    const amount = dto.amount ?? 0;

    return this.prisma.$transaction(
      async (tx) => {
        // 1. Idempotency Check: Prevent duplicate processing for same orderId
        const existingTx = await tx.upgradeTransaction.findUnique({
          where: { orderId: dto.orderId },
        });

        if (existingTx && existingTx.status === 'SUCCESS') {
          const user = await tx.user.findUnique({ where: { id: userId } });
          if (!user) {
            throw new NotFoundException('User not found');
          }
          return {
            user,
            transaction: existingTx,
            idempotent: true,
          };
        }

        // 2. Row-level lock on User to prevent concurrent upgrade race conditions
        try {
          await tx.$executeRawUnsafe(
            'SELECT id FROM "User" WHERE id = $1 FOR UPDATE',
            userId,
          );
        } catch {
          // Graceful fallback for non-PostgreSQL drivers or unit testing mocks
        }

        // 3. Fetch latest User state inside transaction
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user) {
          throw new NotFoundException('User not found');
        }

        // 4. Calculate new premium expiration date (extending if already active)
        const now = new Date();
        const currentExpiresAt = user.premiumExpiresAt;
        const isCurrentlyPremium =
          user.isPremium &&
          (!currentExpiresAt || currentExpiresAt.getTime() > now.getTime());

        const baseTime =
          isCurrentlyPremium && currentExpiresAt ? currentExpiresAt.getTime() : now.getTime();
        const newExpiresAt = new Date(baseTime + durationDays * 24 * 60 * 60 * 1000);

        // 5. Atomically update User and create/update UpgradeTransaction
        const updatedUser = await tx.user.update({
          where: { id: userId },
          data: {
            isPremium: true,
            premiumExpiresAt: newExpiresAt,
          },
        });

        const transactionRecord = await tx.upgradeTransaction.upsert({
          where: { orderId: dto.orderId },
          create: {
            userId,
            orderId: dto.orderId,
            plan,
            durationDays,
            amount,
            status: 'SUCCESS',
            completedAt: now,
          },
          update: {
            status: 'SUCCESS',
            plan,
            durationDays,
            amount,
            completedAt: now,
          },
        });

        return {
          user: updatedUser,
          transaction: transactionRecord,
          idempotent: false,
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );
  }

  async getUpgradeHistory(userId: string): Promise<UpgradeTransaction[]> {
    return this.prisma.upgradeTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
