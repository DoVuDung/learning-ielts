import { NextRequest, NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";

export interface TranscriptLine {
  text: string;
  offset: number; // ms
  duration: number; // ms
  lang: string;
}

const ALLOWED_LANGS = new Set(["en", "vi"]);

// Matches Arabic, Hebrew, and other RTL scripts that should not appear in this app
const NON_LATIN_SCRIPT_RE = /[؀-ۿ֐-׿ݐ-ݿࢠ-ࣿ]/;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const youtubeId = searchParams.get("videoId");
  const rawLang = searchParams.get("lang") ?? "en";
  const lang = ALLOWED_LANGS.has(rawLang) ? rawLang : "en";

  if (!youtubeId) {
    return NextResponse.json({ error: "videoId is required" }, { status: 400 });
  }

  try {
    const lines = await YoutubeTranscript.fetchTranscript(youtubeId, { lang });
    const result: TranscriptLine[] = lines.map((l) => ({
      text: l.text.replaceAll("\n", " ").trim(),
      offset: Math.round(l.offset),
      duration: Math.round(l.duration),
      lang: (l as { lang?: string }).lang ?? lang,
    }));

    // Reject transcripts that contain Arabic/Hebrew or other unsupported scripts
    const sample = result.slice(0, 10).map((l) => l.text).join(" ");
    if (NON_LATIN_SCRIPT_RE.test(sample)) {
      return NextResponse.json(
        { error: `Transcript language not supported. Only English (en) and Vietnamese (vi) are allowed.` },
        { status: 422 },
      );
    }

    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, max-age=3600" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch transcript";
    const status = msg.toLowerCase().includes("language") ? 404 : 502;
    return NextResponse.json({ error: msg }, { status });
  }
}
