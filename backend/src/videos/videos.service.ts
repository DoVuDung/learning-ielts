import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateVideoDto } from './dto/create-video.dto';

export interface TranscriptItem {
  text: string;
  offset: number;
  duration: number;
}

export type CaptionTrack = { languageCode: string; baseUrl: string };

const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

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

  private async fetchCaptionTracks(youtubeId: string): Promise<CaptionTrack[] | null> {
    try {
      const res = await fetch(`https://www.youtube.com/watch?v=${youtubeId}`, {
        headers: { 'User-Agent': BROWSER_UA, 'Accept-Language': 'en-US,en;q=0.9' },
      });
      if (!res.ok) return null;

      const html = await res.text();
      return this.extractCaptionTracksFromHtml(html);
    } catch {
      return null;
    }
  }

  private extractCaptionTracksFromHtml(html: string): CaptionTrack[] | null {
    const marker = 'ytInitialPlayerResponse = ';
    const start = html.indexOf(marker);
    if (start === -1) return null;

    const jsonStart = start + marker.length;
    let depth = 0;
    let jsonEnd = jsonStart;
    for (let i = jsonStart; i < html.length; i++) {
      if (html[i] === '{') depth++;
      else if (html[i] === '}') {
        depth--;
        if (depth === 0) {
          jsonEnd = i + 1;
          break;
        }
      }
    }

    try {
      const playerResponse = JSON.parse(html.slice(jsonStart, jsonEnd)) as {
        captions?: {
          playerCaptionsTracklistRenderer?: { captionTracks?: CaptionTrack[] };
        };
      };
      const tracks =
        playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      return tracks && tracks.length > 0 ? tracks : null;
    } catch {
      return null;
    }
  }

  private parseTranscriptXml(xml: string): TranscriptItem[] {
    const items: TranscriptItem[] = [];
    const re = /<p\s+t="(\d+)"\s+d="(\d+)"[^>]*>([\s\S]*?)<\/p>/g;
    let m: RegExpExecArray | null;
    while ((m = re.exec(xml)) !== null) {
      const text = m[3]
        .replace(/<[^>]+>/g, '')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/\n/g, ' ')
        .trim();
      if (text) {
        items.push({ text, offset: Number(m[1]), duration: Number(m[2]) });
      }
    }
    return items;
  }

  private async fetchTranscript(youtubeId: string): Promise<TranscriptItem[] | null> {
    const tracks = await this.fetchCaptionTracks(youtubeId);
    if (!tracks) return null;

    const track =
      tracks.find((t) => t.languageCode === 'en') ??
      tracks.find((t) => t.languageCode.startsWith('en')) ??
      tracks[0];

    const captionRes = await fetch(track.baseUrl, {
      headers: { 'User-Agent': BROWSER_UA },
    });
    if (!captionRes.ok) return null;

    const xml = await captionRes.text();
    const items = this.parseTranscriptXml(xml);
    return items.length > 0 ? items : null;
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
