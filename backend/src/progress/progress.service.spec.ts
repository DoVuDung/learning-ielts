import { Test, TestingModule } from '@nestjs/testing';
import { ProgressService } from './progress.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ProgressService', () => {
  let service: ProgressService;
  let prisma: PrismaService;

  const mockPrisma = {
    dictationProgress: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgressService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ProgressService>(ProgressService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all dictation progress for a user ordered by updatedAt desc', async () => {
      const mockResult = [{ id: 'p1', userId: 'u1' }];
      mockPrisma.dictationProgress.findMany.mockResolvedValue(mockResult);

      const res = await service.findAll('u1');
      expect(res).toEqual(mockResult);
      expect(mockPrisma.dictationProgress.findMany).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        include: {
          video: { select: { title: true, thumbnailUrl: true, level: true } },
        },
        orderBy: { updatedAt: 'desc' },
      });
    });
  });

  describe('findByVideo', () => {
    it('should return existing progress if found', async () => {
      const mockProgress = { id: 'p1', sentencesDone: 5, totalSentences: 10 };
      mockPrisma.dictationProgress.findUnique.mockResolvedValue(mockProgress);

      const res = await service.findByVideo('u1', 'v1');
      expect(res).toEqual(mockProgress);
      expect(mockPrisma.dictationProgress.findUnique).toHaveBeenCalledWith({
        where: { userId_videoId: { userId: 'u1', videoId: 'v1' } },
      });
    });

    it('should return default progress if null', async () => {
      mockPrisma.dictationProgress.findUnique.mockResolvedValue(null);

      const res = await service.findByVideo('u1', 'v1');
      expect(res).toEqual({ sentencesDone: 0, totalSentences: 0 });
    });
  });

  describe('upsert', () => {
    it('should upsert progress and set completedAt when sentencesDone >= totalSentences', async () => {
      const mockResult = { id: 'p1', sentencesDone: 10, totalSentences: 10 };
      mockPrisma.dictationProgress.upsert.mockResolvedValue(mockResult);

      const res = await service.upsert('u1', {
        videoId: 'v1',
        sentencesDone: 10,
        totalSentences: 10,
      });

      expect(res).toEqual(mockResult);
      expect(mockPrisma.dictationProgress.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId_videoId: { userId: 'u1', videoId: 'v1' } },
          update: expect.objectContaining({
            sentencesDone: 10,
            totalSentences: 10,
            completedAt: expect.any(Date),
          }),
          create: expect.objectContaining({
            userId: 'u1',
            videoId: 'v1',
            sentencesDone: 10,
            totalSentences: 10,
            completedAt: expect.any(Date),
          }),
        }),
      );
    });

    it('should upsert progress and set completedAt to null when sentencesDone < totalSentences', async () => {
      const mockResult = { id: 'p1', sentencesDone: 3, totalSentences: 10 };
      mockPrisma.dictationProgress.upsert.mockResolvedValue(mockResult);

      await service.upsert('u1', {
        videoId: 'v1',
        sentencesDone: 3,
        totalSentences: 10,
      });

      expect(mockPrisma.dictationProgress.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({ completedAt: null }),
          create: expect.objectContaining({ completedAt: null }),
        }),
      );
    });
  });
});
