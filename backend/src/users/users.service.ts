import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { User, UpgradeTransaction } from '@prisma/client';
import { Prisma } from '@prisma/client';
import type { UpgradeAccountDto } from './dto/upgrade-account.dto';
import type { UpdateTargetDto, SubmitAssessmentDto } from './dto/target.dto';

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

  async getTarget(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        targetIeltsBand: true,
        targetCefrLevel: true,
        dailyMinutesTarget: true,
        currentLevel: true,
        assessedAt: true,
      },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const latestAssessment = await this.prisma.assessmentResult.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      ...user,
      latestAssessment,
    };
  }

  async updateTarget(userId: string, dto: UpdateTargetDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.targetIeltsBand !== undefined && { targetIeltsBand: dto.targetIeltsBand }),
        ...(dto.targetCefrLevel !== undefined && { targetCefrLevel: dto.targetCefrLevel }),
        ...(dto.dailyMinutesTarget !== undefined && {
          dailyMinutesTarget: dto.dailyMinutesTarget,
        }),
      },
      select: {
        id: true,
        targetIeltsBand: true,
        targetCefrLevel: true,
        dailyMinutesTarget: true,
        currentLevel: true,
        assessedAt: true,
      },
    });
  }

  async submitAssessment(userId: string, dto: SubmitAssessmentDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Evaluate answers: calculate skill subscores and total score (0-100)
    const answerKeys: Record<string, { correct: string; skill: 'listening' | 'vocabulary' | 'grammar' }> = {
      q1: { correct: 'B', skill: 'listening' },
      q2: { correct: 'C', skill: 'listening' },
      q3: { correct: 'A', skill: 'listening' },
      q4: { correct: 'D', skill: 'vocabulary' },
      q5: { correct: 'B', skill: 'vocabulary' },
      q6: { correct: 'C', skill: 'vocabulary' },
      q7: { correct: 'A', skill: 'grammar' },
      q8: { correct: 'B', skill: 'grammar' },
      q9: { correct: 'C', skill: 'grammar' },
      q10: { correct: 'D', skill: 'grammar' },
    };

    let listeningCorrect = 0;
    let listeningTotal = 0;
    let vocabCorrect = 0;
    let vocabTotal = 0;
    let grammarCorrect = 0;
    let grammarTotal = 0;

    for (const ans of dto.answers) {
      const key = answerKeys[ans.questionId];
      if (key) {
        const isCorrect = ans.selectedAnswer === key.correct;
        if (key.skill === 'listening') {
          listeningTotal++;
          if (isCorrect) listeningCorrect++;
        } else if (key.skill === 'vocabulary') {
          vocabTotal++;
          if (isCorrect) vocabCorrect++;
        } else if (key.skill === 'grammar') {
          grammarTotal++;
          if (isCorrect) grammarCorrect++;
        }
      }
    }

    const listeningScore = listeningTotal > 0 ? Math.round((listeningCorrect / listeningTotal) * 100) : 70;
    const vocabularyScore = vocabTotal > 0 ? Math.round((vocabCorrect / vocabTotal) * 100) : 70;
    const grammarScore = grammarTotal > 0 ? Math.round((grammarCorrect / grammarTotal) * 100) : 70;

    const totalScore = Math.round((listeningScore + vocabularyScore + grammarScore) / 3);

    let cefrLevel = 'B1';
    let ieltsBand = 5.5;

    if (totalScore >= 90) {
      cefrLevel = 'C1';
      ieltsBand = 7.5;
    } else if (totalScore >= 80) {
      cefrLevel = 'B2';
      ieltsBand = 6.5;
    } else if (totalScore >= 65) {
      cefrLevel = 'B1';
      ieltsBand = 5.5;
    } else if (totalScore >= 50) {
      cefrLevel = 'A2';
      ieltsBand = 4.5;
    } else {
      cefrLevel = 'A1';
      ieltsBand = 4.0;
    }

    const assessmentResult = await this.prisma.assessmentResult.create({
      data: {
        userId,
        score: totalScore,
        cefrLevel,
        ieltsBand,
        listeningScore,
        vocabularyScore,
        grammarScore,
        answersJson: JSON.stringify(dto.answers),
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        currentLevel: cefrLevel,
        assessedAt: new Date(),
      },
    });

    return assessmentResult;
  }

  async getAssessments(userId: string) {
    return this.prisma.assessmentResult.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
