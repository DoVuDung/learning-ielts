import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const notes = await prisma.note.findMany({
    where: { userId: session.sub },
    orderBy: { createdAt: "desc" },
    include: { cards: true },
  });

  return NextResponse.json(notes);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { word, context, videoId, definition } = (await req.json()) as {
    word: string;
    context?: string;
    videoId?: string;
    definition?: string;
  };

  const normalized = word.toLowerCase().trim();

  const note = await prisma.note.upsert({
    where: { userId_word: { userId: session.sub, word: normalized } },
    update: {
      ...(context !== undefined && { context }),
      ...(videoId !== undefined && { videoId }),
      ...(definition !== undefined && { definition }),
    },
    create: {
      userId: session.sub,
      word: normalized,
      context,
      videoId,
      definition,
      cards: {
        create: { userId: session.sub, template: "WORD_TO_MEANING" },
      },
    },
    include: { cards: true },
  });

  return NextResponse.json(note, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { word } = (await req.json()) as { word: string };

  await prisma.note.deleteMany({
    where: { userId: session.sub, word: word.toLowerCase().trim() },
  });

  return NextResponse.json({ ok: true });
}
