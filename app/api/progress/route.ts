import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const videoId = req.nextUrl.searchParams.get("videoId");
  if (!videoId) {
    const all = await prisma.dictationProgress.findMany({
      where: { userId: session.sub },
      include: { video: { select: { title: true, thumbnailUrl: true, level: true } } },
      orderBy: { updatedAt: "desc" },
    });
    return NextResponse.json(all);
  }

  const progress = await prisma.dictationProgress.findUnique({
    where: { userId_videoId: { userId: session.sub, videoId } },
  });
  return NextResponse.json(progress ?? { sentencesDone: 0, totalSentences: 0 });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { videoId, sentencesDone, totalSentences } = await req.json() as {
    videoId: string;
    sentencesDone: number;
    totalSentences: number;
  };

  const progress = await prisma.dictationProgress.upsert({
    where: { userId_videoId: { userId: session.sub, videoId } },
    update: {
      sentencesDone,
      totalSentences,
      completedAt: sentencesDone >= totalSentences ? new Date() : null,
    },
    create: {
      userId: session.sub,
      videoId,
      sentencesDone,
      totalSentences,
      completedAt: sentencesDone >= totalSentences ? new Date() : null,
    },
  });

  return NextResponse.json(progress);
}
