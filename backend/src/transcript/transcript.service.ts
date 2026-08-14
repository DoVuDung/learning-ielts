import { Injectable } from '@nestjs/common';
import { YoutubeTranscript } from 'youtube-transcript';

export interface TranscriptLine {
  text: string;
  offset: number;
  duration: number;
  lang: string;
}

const ALLOWED_LANGS = new Set(['en', 'vi']);
const NON_LATIN_SCRIPT_RE = /[؀-ۿ֐-׿ݐ-ݿࢠ-ࣿ]/;

@Injectable()
export class TranscriptService {
  async fetch(videoId: string, rawLang: string): Promise<TranscriptLine[]> {
    const lang = ALLOWED_LANGS.has(rawLang) ? rawLang : 'en';

    const items = await this.fetchMultiClient(videoId, lang);
    if (!items || items.length === 0) {
      throw new Error('No transcript available for this video');
    }

    const result: TranscriptLine[] = items.map((l) => ({
      text: l.text.replaceAll('\n', ' ').trim(),
      offset: Math.round(l.offset),
      duration: Math.round(l.duration),
      lang,
    }));

    const sample = result.slice(0, 10).map((l) => l.text).join(' ');
    if (NON_LATIN_SCRIPT_RE.test(sample)) {
      throw new Error('Transcript language not supported. Only English (en) and Vietnamese (vi) are allowed.');
    }

    return result;
  }

  private async fetchMultiClient(youtubeId: string, lang: string): Promise<{ text: string; offset: number; duration: number }[] | null> {
    const clients: Array<'WEB_EMBEDDED_PLAYER' | 'IOS' | 'ANDROID' | 'WEB'> = [
      'WEB_EMBEDDED_PLAYER',
      'IOS',
      'ANDROID',
      'WEB',
    ];

    for (const client of clients) {
      const items = await this.fetchInnertubeCaptionTracks(youtubeId, client, lang);
      if (items && items.length > 0) return items;
    }

    // Fallback to youtube-transcript library
    try {
      const raw = await YoutubeTranscript.fetchTranscript(youtubeId, { lang });
      if (raw && raw.length > 0) {
        return raw.map((r) => ({
          text: r.text,
          offset: Math.round(r.offset),
          duration: Math.round(r.duration),
        }));
      }
    } catch {}

    return null;
  }

  private async fetchInnertubeCaptionTracks(
    youtubeId: string,
    clientName: 'WEB_EMBEDDED_PLAYER' | 'IOS' | 'ANDROID' | 'WEB',
    targetLang: string,
  ): Promise<{ text: string; offset: number; duration: number }[] | null> {
    try {
      let clientVersion = '2.20240101.00.00';
      let userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)';

      if (clientName === 'WEB_EMBEDDED_PLAYER') {
        clientVersion = '5.20230602.00.00';
        userAgent =
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
      } else if (clientName === 'IOS') {
        clientVersion = '19.45.4';
        userAgent =
          'com.google.ios.youtube/19.45.4 (iPhone16,2; U; CPU iOS 17_5 like Mac OS X; en_US)';
      } else if (clientName === 'ANDROID') {
        clientVersion = '19.02.39';
        userAgent =
          'com.google.android.youtube/19.02.39 (Linux; U; Android 14; en_US)';
      }

      const payload = {
        context: {
          client: {
            clientName,
            clientVersion,
            hl: targetLang,
            gl: 'US',
            contentCheckOk: true,
            racyCheckOk: true,
          },
        },
        videoId: youtubeId,
      };

      const res = await fetch('https://www.youtube.com/youtubei/v1/player', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': userAgent,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) return null;
      const data = (await res.json()) as any;
      const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      if (!tracks || tracks.length === 0) return null;

      const track =
        tracks.find((t: any) => t.languageCode?.startsWith(targetLang)) || tracks[0];
      if (!track || !track.baseUrl) return null;

      const url = track.baseUrl.includes('fmt=') ? track.baseUrl : `${track.baseUrl}&fmt=json3`;
      const trackRes = await fetch(url, {
        headers: { 'User-Agent': userAgent },
      });
      if (!trackRes.ok) return null;
      const text = await trackRes.text();

      const jsonItems = this.parseJson3Subtitles(text);
      if (jsonItems.length > 0) return jsonItems;

      return this.parseXmlSubtitles(text);
    } catch {
      return null;
    }
  }

  private parseJson3Subtitles(jsonStr: string): { text: string; offset: number; duration: number }[] {
    try {
      const data = JSON.parse(jsonStr);
      const events = data.events || [];
      const items: { text: string; offset: number; duration: number }[] = [];
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

  private parseXmlSubtitles(xmlStr: string): { text: string; offset: number; duration: number }[] {
    const items: { text: string; offset: number; duration: number }[] = [];
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
    return items;
  }
}
