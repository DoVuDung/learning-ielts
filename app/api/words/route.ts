import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const words = await prisma.savedWord.findMany({
    where: { userId: session.sub },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(words);
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { word, context, videoId } = await req.json() as {
    word: string;
    context?: string;
    videoId?: string;
  };

  const saved = await prisma.savedWord.upsert({
    where: { userId_word: { userId: session.sub, word: word.toLowerCase().trim() } },
    update: {},
    create: {
      userId: session.sub,
      word: word.toLowerCase().trim(),
      context,
      videoId,
    },
  });

  return NextResponse.json(saved, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { word } = await req.json() as { word: string };

  await prisma.savedWord.deleteMany({
    where: { userId: session.sub, word: word.toLowerCase().trim() },
  });

  return NextResponse.json({ ok: true });
}
