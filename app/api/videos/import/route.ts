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

type CaptionTrack = { languageCode: string; baseUrl: string };

const INNERTUBE_CLIENTS = [
  {
    name: "IOS",
    body: {
      context: { client: { clientName: "IOS", clientVersion: "19.29.1", deviceModel: "iPhone16,2" } },
    },
    userAgent: "com.google.ios.youtube/19.29.1 (iPhone16,2; U; CPU iOS 17_5_1 like Mac OS X;)",
  },
  {
    name: "ANDROID",
    body: {
      context: { client: { clientName: "ANDROID", clientVersion: "20.10.38" } },
    },
    userAgent: "com.google.android.youtube/20.10.38 (Linux; U; Android 14)",
  },
  {
    name: "TVHTML5",
    body: {
      context: { client: { clientName: "TVHTML5", clientVersion: "7.20240101" } },
    },
    userAgent: "Mozilla/5.0 (SMART-TV; Linux; Tizen 6.0) AppleWebKit/538.1 (KHTML, like Gecko) Version/6.0 TV Safari/538.1",
  },
] as const;

async function fetchCaptionTracks(youtubeId: string): Promise<CaptionTrack[] | null> {
  for (const client of INNERTUBE_CLIENTS) {
    try {
      const res = await fetch("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
        method: "POST",
        headers: { "Content-Type": "application/json", "User-Agent": client.userAgent },
        body: JSON.stringify({ ...client.body, videoId: youtubeId }),
      });

      if (!res.ok) {
        console.log(`[import] InnerTube ${client.name} HTTP ${res.status}`);
        continue;
      }

      const data = (await res.json()) as {
        captions?: {
          playerCaptionsTracklistRenderer?: { captionTracks?: CaptionTrack[] };
        };
        playabilityStatus?: { status?: string };
      };

      const status = data?.playabilityStatus?.status;
      const tracks = data?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
      console.log(`[import] InnerTube ${client.name}: playability=${status} tracks=${tracks?.length ?? 0}`);

      if (tracks && tracks.length > 0) return tracks;
    } catch (err) {
      console.log(`[import] InnerTube ${client.name} error:`, err);
    }
  }
  return null;
}

function parseTranscriptXml(xml: string): TranscriptItem[] {
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

async function fetchTranscript(youtubeId: string): Promise<TranscriptItem[] | null> {
  const tracks = await fetchCaptionTracks(youtubeId);
  if (!tracks) {
    console.log(`[import] no caption tracks found for ${youtubeId}`);
    return null;
  }

  const track =
    tracks.find((t) => t.languageCode === "en") ??
    tracks.find((t) => t.languageCode.startsWith("en")) ??
    tracks[0];

  console.log(`[import] fetching captions lang=${track.languageCode}`);

  const captionRes = await fetch(track.baseUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    },
  });

  console.log(`[import] caption fetch status=${captionRes.status}`);
  if (!captionRes.ok) return null;

  const xml = await captionRes.text();
  console.log(`[import] caption XML length=${xml.length}`);

  const items = parseTranscriptXml(xml);
  console.log(`[import] parsed ${items.length} items`);
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
