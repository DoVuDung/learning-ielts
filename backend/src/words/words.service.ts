import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { schedule, type Rating } from './fsrs';
import { parseLlmNoteText } from './llm-note.parser';

@Injectable()
export class WordsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.note.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { cards: true },
    });
  }

  async save(
    userId: string,
    data: { word: string; context?: string; videoId?: string; definition?: string },
  ) {
    const normalized = data.word.toLowerCase().trim();

    return this.prisma.note.upsert({
      where: { userId_word: { userId, word: normalized } },
      update: {
        ...(data.context !== undefined && { context: data.context }),
        ...(data.videoId !== undefined && { videoId: data.videoId }),
        ...(data.definition !== undefined && { definition: data.definition }),
      },
      create: {
        userId,
        word: normalized,
        context: data.context,
        videoId: data.videoId,
        definition: data.definition,
        cards: {
          create: { userId, template: 'WORD_TO_MEANING' },
        },
      },
      include: { cards: true },
    });
  }

  async importLlmNotes(
    userId: string,
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
        where: { userId_word: { userId, word: normalized } },
        update: {
          ...(item.definition && { definition: item.definition }),
          ...(item.context && { context: item.context }),
          ...(item.tags && { tags: item.tags }),
        },
        create: {
          userId,
          word: normalized,
          definition: item.definition,
          context: item.context,
          tags: item.tags ?? ['LLM Note'],
          cards: {
            create: [
              { userId, template: 'WORD_TO_MEANING' },
              { userId, template: 'MEANING_TO_WORD' },
              { userId, template: 'LISTENING' },
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

  async remove(userId: string, word: string) {
    await this.prisma.note.deleteMany({
      where: { userId, word: word.toLowerCase().trim() },
    });
    return { ok: true };
  }

  async review(userId: string, data: { cardId: string; rating: Rating }) {
    const { cardId, rating } = data;

    if (![1, 2, 3, 4].includes(rating)) {
      throw new BadRequestException('Invalid rating');
    }

    const card = await this.prisma.card.findFirst({
      where: { id: cardId, userId },
    });
    if (!card) throw new NotFoundException('Card not found');

    const result = schedule(
      {
        state: card.state,
        due: card.due,
        stability: card.stability,
        difficulty: card.difficulty,
        elapsedDays: card.elapsedDays,
        scheduledDays: card.scheduledDays,
        reps: card.reps,
        lapses: card.lapses,
        lastReview: card.lastReview,
      },
      rating,
    );

    const [updated] = await this.prisma.$transaction([
      this.prisma.card.update({
        where: { id: card.id },
        data: {
          state: result.state,
          due: result.due,
          stability: result.stability,
          difficulty: result.difficulty,
          elapsedDays: result.elapsedDays,
          scheduledDays: result.scheduledDays,
          reps: result.reps,
          lapses: result.lapses,
          lastReview: result.lastReview,
        },
      }),
      this.prisma.reviewLog.create({
        data: {
          cardId: card.id,
          rating,
          state: result.state,
          due: result.due,
          stability: result.stability,
          difficulty: result.difficulty,
          elapsedDays: result.elapsedDays,
          scheduledDays: result.scheduledDays,
        },
      }),
    ]);

    return updated;
  }
}
