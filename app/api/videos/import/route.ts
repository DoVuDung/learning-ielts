import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { extractYoutubeId } from "@/lib/utils";

async function fetchYoutubeMeta(youtubeId: string) {
  try {
    const res = await fetch(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeId}&format=json`
    );
    if (res.ok) {
      const data = await res.json();
      return {
        title: data.title as string,
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

interface TranscriptItem {
  text: string;
  offset: number;
  duration: number;
}

// Use YouTube's InnerTube API (Android client) which works from server environments
async function fetchTranscript(youtubeId: string): Promise<TranscriptItem[] | null> {
  const innerTubeRes = await fetch(
    "https://www.youtube.com/youtubei/v1/player?prettyPrint=false",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "com.google.android.youtube/20.10.38 (Linux; U; Android 14)",
      },
      body: JSON.stringify({
        context: { client: { clientName: "ANDROID", clientVersion: "20.10.38" } },
        videoId: youtubeId,
      }),
    }
  );

  if (!innerTubeRes.ok) return null;

  const data = (await innerTubeRes.json()) as {
    captions?: {
      playerCaptionsTracklistRenderer?: {
        captionTracks?: Array<{ languageCode: string; baseUrl: string }>;
      };
    };
  };

  const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  if (!tracks || tracks.length === 0) return null;

  const track =
    tracks.find((t) => t.languageCode === "en") ??
    tracks.find((t) => t.languageCode.startsWith("en")) ??
    tracks[0];

  if (!track?.baseUrl) return null;

  const captionRes = await fetch(track.baseUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    },
  });

  if (!captionRes.ok) return null;

  const xml = await captionRes.text();

  // Parse XML: <p t="startMs" d="durationMs">text</p>
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
      items.push({ text, offset: parseInt(m[1], 10), duration: parseInt(m[2], 10) });
    }
  }

  return items.length > 0 ? items : null;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { url, category = "general", level = "B2" } = body as {
      url: string;
      category?: string;
      level?: string;
    };

    const youtubeId = extractYoutubeId(url);
    if (!youtubeId) {
      return NextResponse.json({ error: "Invalid YouTube URL" }, { status: 400 });
    }

    // Check duplicate for this user
    const existing = await prisma.video.findFirst({
      where: { youtubeId, createdById: session.sub },
      include: { _count: { select: { sentences: true } } },
    });
    if (existing) return NextResponse.json(existing);

    const [meta, rawTranscript] = await Promise.all([
      fetchYoutubeMeta(youtubeId),
      fetchTranscript(youtubeId),
    ]);

    if (!rawTranscript || rawTranscript.length === 0) {
      return NextResponse.json(
        { error: "No transcript available for this video" },
        { status: 422 }
      );
    }

    // Group transcript items into sentences by splitting on punctuation
    const sentences: { text: string; startMs: number; endMs: number }[] = [];
    let buffer = "";
    let startMs = 0;

    for (const item of rawTranscript) {
      if (buffer === "") startMs = item.offset;
      buffer += (buffer ? " " : "") + item.text;
      const endMs = item.offset + item.duration;

      if (/[.!?]$/.test(buffer.trim()) || buffer.length > 200) {
        sentences.push({ text: buffer.trim(), startMs, endMs });
        buffer = "";
      }
    }
    if (buffer.trim()) {
      const last = rawTranscript.at(-1)!;
      sentences.push({
        text: buffer.trim(),
        startMs,
        endMs: last.offset + last.duration,
      });
    }

    const lastItem = rawTranscript.at(-1);
    const totalDuration = lastItem
      ? Math.round((lastItem.offset + lastItem.duration) / 1000)
      : 0;

    const video = await prisma.video.create({
      data: {
        youtubeId,
        title: meta.title,
        thumbnailUrl: meta.thumbnailUrl,
        duration: totalDuration,
        category,
        level,
        createdById: session.sub,
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

    return NextResponse.json(video, { status: 201 });
  } catch (err) {
    console.error("[import] unexpected error:", err);
    return NextResponse.json({ error: "Import failed. Please try again." }, { status: 500 });
  }
}
