import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { wordId, interval, easeFactor, nextReview } = await req.json() as {
    wordId: string;
    interval: number;
    easeFactor: number;
    nextReview: string;
  };

  const updated = await prisma.savedWord.update({
    where: { id: wordId },
    data: { interval, easeFactor, nextReview: new Date(nextReview) },
  });

  return NextResponse.json(updated);
}
