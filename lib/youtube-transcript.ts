import { transcriptApi } from "@/lib/api-client";

export interface TranscriptItem {
  text: string;
  offset: number;
  duration: number;
}

export type CaptionTrack = { languageCode: string; baseUrl: string };

export function parseTranscriptXml(xml: string): TranscriptItem[] {
  const items: TranscriptItem[] = [];
  const re = /<p\s+t="(\d+)"\s+d="(\d+)"[^>]*>([\s\S]*?)<\/p>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    const text = m[3]
      .replace(/<[^>]+>/g, "")
      .replace(/&#39;/g, "'")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/\n/g, " ")
      .trim();
    if (text) {
      items.push({ text, offset: Number(m[1]), duration: Number(m[2]) });
    }
  }
  return items;
}

export function extractCaptionTracksFromHtml(html: string): CaptionTrack[] | null {
  const marker = "ytInitialPlayerResponse = ";
  const start = html.indexOf(marker);
  if (start === -1) return null;

  const jsonStart = start + marker.length;
  let depth = 0;
  let jsonEnd = jsonStart;
  for (let i = jsonStart; i < html.length; i++) {
    if (html[i] === "{") depth++;
    else if (html[i] === "}") {
      depth--;
      if (depth === 0) { jsonEnd = i + 1; break; }
    }
  }

  try {
    const playerResponse = JSON.parse(html.slice(jsonStart, jsonEnd)) as {
      captions?: { playerCaptionsTracklistRenderer?: { captionTracks?: CaptionTrack[] } };
    };
    const tracks = playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
    return tracks && tracks.length > 0 ? tracks : null;
  } catch {
    return null;
  }
}

export function parseJson3Subtitles(jsonStr: string): TranscriptItem[] {
  try {
    const data = JSON.parse(jsonStr);
    const events = data.events || [];
    const items: TranscriptItem[] = [];
    for (const ev of events) {
      if (!ev.segs) continue;
      const text = ev.segs
        .map((s: any) => s.utf8 || "")
        .join("")
        .replace(/\n/g, " ")
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

export function groupTranscriptIntoSentences(
  items: TranscriptItem[],
): { text: string; startMs: number; endMs: number }[] {
  const sentences: { text: string; startMs: number; endMs: number }[] = [];
  let buffer = "";
  let startMs = 0;

  for (const item of items) {
    if (buffer === "") startMs = item.offset;
    buffer += (buffer ? " " : "") + item.text;
    const endMs = item.offset + item.duration;

    if (/[.!?]$/.test(buffer.trim()) || buffer.length > 200) {
      sentences.push({ text: buffer.trim(), startMs, endMs });
      buffer = "";
    }
  }

  if (buffer.trim()) {
    const last = items.at(-1)!;
    sentences.push({ text: buffer.trim(), startMs, endMs: last.offset + last.duration });
  }

  return sentences;
}

export async function fetchTranscriptClientSide(
  youtubeId: string,
): Promise<{ text: string; startMs: number; endMs: number }[] | null> {
  try {
    const lines = await transcriptApi.fetch(youtubeId);
    if (lines && lines.length > 0) {
      const items: TranscriptItem[] = lines.map((l) => ({
        text: l.text,
        offset: l.offset,
        duration: l.duration,
      }));
      return groupTranscriptIntoSentences(items);
    }
    return null;
  } catch {
    return null;
  }
}
