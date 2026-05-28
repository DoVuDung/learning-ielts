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
