import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateVideoDto } from './dto/create-video.dto';
import { YoutubeTranscript } from 'youtube-transcript';

export interface TranscriptItem {
  text: string;
  offset: number;
  duration: number;
}

@Injectable()
export class VideosService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── Public API ──────────────────────────────────────────────────────────────

  async findAllByUser(userId: string) {
    return this.prisma.video.findMany({
      where: { createdById: userId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { sentences: true } } },
    });
  }

  async findOne(id: string) {
    const video = await this.prisma.video.findUnique({
      where: { id },
      include: { sentences: { orderBy: { index: 'asc' } } },
    });
    if (!video) throw new NotFoundException('Video not found');
    return video;
  }

  async remove(id: string, userId: string) {
    const video = await this.prisma.video.findFirst({
      where: { id, createdById: userId },
    });
    if (!video) throw new NotFoundException('Video not found');
    await this.prisma.video.delete({ where: { id } });
    return { ok: true };
  }

  async importVideo(dto: CreateVideoDto, userId: string) {
    const { url, category = 'general', level = 'B2' } = dto;

    const youtubeId = this.extractYoutubeId(url);
    if (!youtubeId) {
      throw new UnprocessableEntityException('Invalid YouTube URL');
    }

    // Return existing if already imported by this user
    const existing = await this.prisma.video.findFirst({
      where: { youtubeId, createdById: userId },
      include: { _count: { select: { sentences: true } } },
    });
    if (existing) return existing;

    const [meta, rawTranscript] = await Promise.all([
      this.fetchYoutubeMeta(youtubeId),
      this.fetchTranscript(youtubeId),
    ]);

    if (!rawTranscript || rawTranscript.length === 0) {
      throw new UnprocessableEntityException('No transcript available for this video');
    }

    const sentences = this.groupIntoSentences(rawTranscript);

    const lastItem = rawTranscript.at(-1);
    const totalDuration = lastItem
      ? Math.round((lastItem.offset + lastItem.duration) / 1000)
      : 0;

    return this.prisma.video.create({
      data: {
        youtubeId,
        title: meta.title,
        thumbnailUrl: meta.thumbnailUrl,
        duration: totalDuration,
        category,
        level,
        createdById: userId,
        sentences: {
          create: sentences.map((s, i) => ({
            index: i,
            text: s.text,
            startMs: s.startMs,
            endMs: s.endMs,
          })),
        },
      },
      include: { _count: { select: { sentences: true } } },
    });
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  private extractYoutubeId(url: string): string | null {
    try {
      const u = new URL(url);
      if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('?')[0];
      if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/')[2];
      if (u.pathname.startsWith('/embed/')) return u.pathname.split('/')[2];
      return u.searchParams.get('v');
    } catch {
      return null;
    }
  }

  private async fetchYoutubeMeta(youtubeId: string) {
    try {
      const res = await fetch(
        `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeId}&format=json`,
      );
      if (res.ok) {
        const data = (await res.json()) as { title: string };
        return {
          title: data.title,
          thumbnailUrl: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
        };
      }
    } catch {
      // fall through to default
    }
    return {
      title: `YouTube Video (${youtubeId})`,
      thumbnailUrl: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg`,
    };
  }

  private async fetchTranscript(youtubeId: string): Promise<TranscriptItem[] | null> {
    try {
      // Prefer British English, fall back to any English, then whatever is available
      const langPriority = ['en-GB', 'en-US', 'en'];
      let items: TranscriptItem[] | null = null;

      for (const lang of langPriority) {
        try {
          const raw = await YoutubeTranscript.fetchTranscript(youtubeId, { lang });
          if (raw && raw.length > 0) {
            items = raw.map((r) => ({
              text: r.text,
              offset: Math.round(r.offset),
              duration: Math.round(r.duration),
            }));
            break;
          }
        } catch {
          // try next lang
        }
      }

      // Last resort: fetch without specifying a language
      if (!items) {
        const raw = await YoutubeTranscript.fetchTranscript(youtubeId);
        if (raw && raw.length > 0) {
          items = raw.map((r) => ({
            text: r.text,
            offset: Math.round(r.offset),
            duration: Math.round(r.duration),
          }));
        }
      }

      return items;
    } catch {
      return null;
    }
  }

  private groupIntoSentences(
    items: TranscriptItem[],
  ): { text: string; startMs: number; endMs: number }[] {
    const sentences: { text: string; startMs: number; endMs: number }[] = [];
    let buffer = '';
    let startMs = 0;

    for (const item of items) {
      if (buffer === '') startMs = item.offset;
      buffer += (buffer ? ' ' : '') + item.text;
      const endMs = item.offset + item.duration;

      if (/[.!?]$/.test(buffer.trim()) || buffer.length > 200) {
        sentences.push({ text: buffer.trim(), startMs, endMs });
        buffer = '';
      }
    }

    if (buffer.trim()) {
      const last = items.at(-1)!;
      sentences.push({ text: buffer.trim(), startMs, endMs: last.offset + last.duration });
    }

    return sentences;
  }
}
