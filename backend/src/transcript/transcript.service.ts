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

    const lines = await YoutubeTranscript.fetchTranscript(videoId, { lang });
    const result: TranscriptLine[] = lines.map((l) => ({
      text: l.text.replaceAll('\n', ' ').trim(),
      offset: Math.round(l.offset),
      duration: Math.round(l.duration),
      lang: (l as { lang?: string }).lang ?? lang,
    }));

    const sample = result.slice(0, 10).map((l) => l.text).join(' ');
    if (NON_LATIN_SCRIPT_RE.test(sample)) {
      throw new Error('Transcript language not supported. Only English (en) and Vietnamese (vi) are allowed.');
    }

    return result;
  }
}
