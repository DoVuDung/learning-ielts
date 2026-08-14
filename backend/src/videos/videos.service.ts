import { Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { CreateVideoDto } from './dto/create-video.dto';
import { YoutubeTranscript, TranscriptConfig } from 'youtube-transcript';
import fetch from 'node-fetch';

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
    const { url, category = 'general', level = 'B2', sentences: clientSentences } = dto;

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

    let sentences: { text: string; startMs: number; endMs: number }[] = [];
    let totalDuration = 0;
    let meta = { title: `YouTube Video (${youtubeId})`, thumbnailUrl: `https://i.ytimg.com/vi/${youtubeId}/hqdefault.jpg` };

    if (clientSentences && clientSentences.length > 0) {
      meta = await this.fetchYoutubeMeta(youtubeId);
      sentences = clientSentences;
      const last = sentences.at(-1);
      totalDuration = last ? Math.round(last.endMs / 1000) : 0;
    } else {
      const [fetchedMeta, rawTranscript] = await Promise.all([
        this.fetchYoutubeMeta(youtubeId),
        this.fetchTranscript(youtubeId),
      ]);
      meta = fetchedMeta;

      if (!rawTranscript || rawTranscript.length === 0) {
        throw new UnprocessableEntityException('No transcript available for this video');
      }

      sentences = this.groupIntoSentences(rawTranscript);
      const lastItem = rawTranscript.at(-1);
      totalDuration = lastItem
        ? Math.round((lastItem.offset + lastItem.duration) / 1000)
        : 0;
    }

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
    // Stage 1: Try Innertube Android API (most reliable from cloud provider IPs)
    const androidItems = await this.fetchInnertubeCaptionTracks(youtubeId, 'ANDROID');
    if (androidItems && androidItems.length > 0) return androidItems;

    // Stage 2: Try Innertube Web API
    const webItems = await this.fetchInnertubeCaptionTracks(youtubeId, 'WEB');
    if (webItems && webItems.length > 0) return webItems;

    // Stage 3: Try direct timedtext endpoint
    const timedtextItems = await this.fetchDirectTimedtext(youtubeId);
    if (timedtextItems && timedtextItems.length > 0) return timedtextItems;

    // Stage 4: Scraper fallback via youtube-transcript library
    try {
      const langPriority = ['en-GB', 'en-US', 'en'];
      let items: TranscriptItem[] | null = null;

      const fetchOptions: TranscriptConfig = {};
      if (process.env.YOUTUBE_PROXY_URL) {
        const { HttpsProxyAgent } = require('https-proxy-agent');
        const proxyAgent = new HttpsProxyAgent(process.env.YOUTUBE_PROXY_URL);
        // @ts-ignore: custom fetch type compatibility
        fetchOptions.fetch = (url: any, options: any) => fetch(url, { ...options, agent: proxyAgent });
      }

      for (const lang of langPriority) {
        try {
          const raw = await YoutubeTranscript.fetchTranscript(youtubeId, { lang, ...fetchOptions });
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

      if (!items) {
        const raw = await YoutubeTranscript.fetchTranscript(youtubeId, fetchOptions);
        if (raw && raw.length > 0) {
          items = raw.map((r) => ({
            text: r.text,
            offset: Math.round(r.offset),
            duration: Math.round(r.duration),
          }));
        }
      }

      if (items && items.length > 0) return items;
    } catch {
      // fall through
    }

    return null;
  }

  private async fetchInnertubeCaptionTracks(
    youtubeId: string,
    clientName: 'ANDROID' | 'WEB',
  ): Promise<TranscriptItem[] | null> {
    try {
      const payload = {
        context: {
          client: {
            clientName: clientName,
            clientVersion: clientName === 'ANDROID' ? '19.02.39' : '2.20240101.00.00',
            hl: 'en',
            gl: 'US',
          },
        },
        videoId: youtubeId,
      };

      const res = await fetch('https://www.youtube.com/youtubei/v1/player', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent':
            clientName === 'ANDROID'
              ? 'com.google.android.youtube/19.02.39 (Linux; U; Android 14; en_US)'
              : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) return null;
      const data = (await res.json()) as any;
      const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      if (!tracks || tracks.length === 0) return null;

      const track =
        tracks.find((t: any) => t.languageCode?.startsWith('en')) || tracks[0];
      if (!track || !track.baseUrl) return null;

      const url = track.baseUrl.includes('fmt=') ? track.baseUrl : `${track.baseUrl}&fmt=json3`;
      const trackRes = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
      });
      if (!trackRes.ok) return null;
      const text = await trackRes.text();

      const jsonItems = this.parseJson3Subtitles(text);
      if (jsonItems.length > 0) return jsonItems;

      const xmlItems = this.parseXmlSubtitles(text);
      if (xmlItems.length > 0) return xmlItems;

      return null;
    } catch {
      return null;
    }
  }

  private async fetchDirectTimedtext(youtubeId: string): Promise<TranscriptItem[] | null> {
    const langs = ['en', 'en-US', 'en-GB', 'vi'];
    const formats = ['&fmt=json3', ''];

    for (const lang of langs) {
      for (const fmt of formats) {
        try {
          const url = `https://www.youtube.com/api/timedtext?v=${youtubeId}&lang=${lang}${fmt}`;
          const res = await fetch(url, {
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            },
          });
          if (res.ok) {
            const body = await res.text();
            if (body) {
              const items = fmt.includes('json3')
                ? this.parseJson3Subtitles(body)
                : this.parseXmlSubtitles(body);
              if (items.length > 0) return items;
            }
          }
        } catch {}
      }
    }
    return null;
  }

  private parseJson3Subtitles(jsonStr: string): TranscriptItem[] {
    try {
      const data = JSON.parse(jsonStr);
      const events = data.events || [];
      const items: TranscriptItem[] = [];
      for (const ev of events) {
        if (!ev.segs) continue;
        const text = ev.segs
          .map((s: any) => s.utf8 || '')
          .join('')
          .replace(/\n/g, ' ')
          .trim();
        if (text) {
          items.push({
            text,
            offset: Math.round(ev.tStartMs || 0),
            duration: Math.round(ev.dDurationMs || 0),
          });
        }
      }
      return items;
    } catch {
      return [];
    }
  }

  private parseXmlSubtitles(xmlStr: string): TranscriptItem[] {
    const items: TranscriptItem[] = [];
    const pRegex = /<p\s+t="(\d+)"\s+d="(\d+)"[^>]*>([\s\S]*?)<\/p>/g;
    let m: RegExpExecArray | null;
    while ((m = pRegex.exec(xmlStr)) !== null) {
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
    if (items.length > 0) return items;

    const textRegex = /<text\s+start="([\d.]+)"\s+dur="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g;
    while ((m = textRegex.exec(xmlStr)) !== null) {
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
        const offset = Math.round(parseFloat(m[1]) * 1000);
        const duration = Math.round(parseFloat(m[2]) * 1000);
        items.push({ text, offset, duration });
      }
    }
    return items;
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
