import { NextRequest, NextResponse } from "next/server";
import { YoutubeTranscript } from "youtube-transcript";
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
    YoutubeTranscript.fetchTranscript(youtubeId).catch(() => null),
  ]);

  if (!rawTranscript || rawTranscript.length === 0) {
    return NextResponse.json({ error: "No transcript available for this video" }, { status: 422 });
  }

  // Group transcript items into sentences by splitting on punctuation
  const sentences: { text: string; startMs: number; endMs: number }[] = [];
  let buffer = "";
  let startMs = 0;

  for (const item of rawTranscript) {
    if (buffer === "") startMs = Math.round(item.offset);
    buffer += (buffer ? " " : "") + item.text.replaceAll("\n", " ").trim();
    const endMs = Math.round(item.offset + item.duration);

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
      endMs: Math.round(last.offset + last.duration),
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
