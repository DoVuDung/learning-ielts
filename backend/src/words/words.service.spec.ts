import { Test, TestingModule } from '@nestjs/testing';
import { WordsService } from './words.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';

describe('WordsService', () => {
  let service: WordsService;
  let prisma: PrismaService;

  const mockPrisma = {
    note: {
      findMany: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    card: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    reviewLog: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WordsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<WordsService>(WordsService);
    prisma = module.get<PrismaService>(PrismaService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all user notes ordered by createdAt desc with cards', async () => {
      const mockNotes = [{ id: 'n1', word: 'apple', cards: [] }];
      mockPrisma.note.findMany.mockResolvedValue(mockNotes);

      const res = await service.findAll('u1');
      expect(res).toEqual(mockNotes);
      expect(mockPrisma.note.findMany).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        orderBy: { createdAt: 'desc' },
        include: { cards: true },
      });
    });
  });

  describe('save', () => {
    it('should upsert note normalizing word to lower-case trim', async () => {
      const mockNote = { id: 'n1', word: 'apple', cards: [] };
      mockPrisma.note.upsert.mockResolvedValue(mockNote);

      const res = await service.save('u1', {
        word: '  Apple ',
        context: 'I eat an apple',
        videoId: 'v1',
        definition: 'A fruit',
      });

      expect(res).toEqual(mockNote);
      expect(mockPrisma.note.upsert).toHaveBeenCalledWith({
        where: { userId_word: { userId: 'u1', word: 'apple' } },
        update: {
          context: 'I eat an apple',
          videoId: 'v1',
          definition: 'A fruit',
        },
        create: {
          userId: 'u1',
          word: 'apple',
          context: 'I eat an apple',
          videoId: 'v1',
          definition: 'A fruit',
          cards: {
            create: { userId: 'u1', template: 'WORD_TO_MEANING' },
          },
        },
        include: { cards: true },
      });
    });
  });

  describe('importLlmNotes', () => {
    it('should import notes from rawText and notes array', async () => {
      mockPrisma.note.upsert.mockResolvedValue({
        id: 'note-1',
        word: 'ubiquitous',
        cards: [],
      });

      const result = await service.importLlmNotes('u1', {
        rawText: '1. Ubiquitous - có mặt khắp nơi',
        notes: [{ word: '' }, { word: 'ephemeral', definition: 'short-lived' }],
      });

      expect(result.success).toBe(true);
      expect(result.importedCount).toBe(2);
    });

    it('should throw BadRequestException if no valid notes found', async () => {
      await expect(service.importLlmNotes('u1', { rawText: '   ' })).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('remove', () => {
    it('should delete notes by normalized word and user', async () => {
      mockPrisma.note.deleteMany.mockResolvedValue({ count: 1 });

      const res = await service.remove('u1', ' APPLE ');
      expect(res).toEqual({ ok: true });
      expect(mockPrisma.note.deleteMany).toHaveBeenCalledWith({
        where: { userId: 'u1', word: 'apple' },
      });
    });
  });

  describe('review', () => {
    it('should throw BadRequestException if rating is invalid', async () => {
      await expect(
        service.review('u1', { cardId: 'c1', rating: 5 as any }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if card not found for user', async () => {
      mockPrisma.card.findFirst.mockResolvedValue(null);
      await expect(
        service.review('u1', { cardId: 'c1', rating: 3 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should calculate new FSRS schedule, update card and create review log in transaction', async () => {
      const mockCard = {
        id: 'c1',
        userId: 'u1',
        state: 'NEW' as const,
        due: new Date(),
        stability: 0,
        difficulty: 0,
        elapsedDays: 0,
        scheduledDays: 0,
        reps: 0,
        lapses: 0,
        lastReview: null,
      };

      mockPrisma.card.findFirst.mockResolvedValue(mockCard);
      const updatedCard = { ...mockCard, state: 'LEARNING', reps: 1 };
      mockPrisma.$transaction.mockResolvedValue([updatedCard, {}]);

      const res = await service.review('u1', { cardId: 'c1', rating: 3 });
      expect(res).toEqual(updatedCard);
      expect(mockPrisma.$transaction).toHaveBeenCalled();
    });
  });
});
