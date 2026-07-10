import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.dictationProgress.findMany({
      where: { userId },
      include: {
        video: { select: { title: true, thumbnailUrl: true, level: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findByVideo(userId: string, videoId: string) {
    const progress = await this.prisma.dictationProgress.findUnique({
      where: { userId_videoId: { userId, videoId } },
    });
    return progress ?? { sentencesDone: 0, totalSentences: 0 };
  }

  async upsert(
    userId: string,
    data: { videoId: string; sentencesDone: number; totalSentences: number },
  ) {
    const { videoId, sentencesDone, totalSentences } = data;
    return this.prisma.dictationProgress.upsert({
      where: { userId_videoId: { userId, videoId } },
      update: {
        sentencesDone,
        totalSentences,
        completedAt: sentencesDone >= totalSentences ? new Date() : null,
      },
      create: {
        userId,
        videoId,
        sentencesDone,
        totalSentences,
        completedAt: sentencesDone >= totalSentences ? new Date() : null,
      },
    });
  }
}
