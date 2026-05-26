import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { schedule, type Rating } from "@/lib/fsrs";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { cardId, rating } = (await req.json()) as {
    cardId: string;
    rating: Rating;
  };

  if (![1, 2, 3, 4].includes(rating)) {
    return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
  }

  const card = await prisma.card.findFirst({
    where: { id: cardId, userId: session.sub },
  });
  if (!card) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const result = schedule(
    {
      state: card.state,
      due: card.due,
      stability: card.stability,
      difficulty: card.difficulty,
      elapsedDays: card.elapsedDays,
      scheduledDays: card.scheduledDays,
      reps: card.reps,
      lapses: card.lapses,
      lastReview: card.lastReview,
    },
    rating,
  );

  const [updated] = await prisma.$transaction([
    prisma.card.update({
      where: { id: card.id },
      data: {
        state: result.state,
        due: result.due,
        stability: result.stability,
        difficulty: result.difficulty,
        elapsedDays: result.elapsedDays,
        scheduledDays: result.scheduledDays,
        reps: result.reps,
        lapses: result.lapses,
        lastReview: result.lastReview,
      },
    }),
    prisma.reviewLog.create({
      data: {
        cardId: card.id,
        rating,
        state: result.state,
        due: result.due,
        stability: result.stability,
        difficulty: result.difficulty,
        elapsedDays: result.elapsedDays,
        scheduledDays: result.scheduledDays,
      },
    }),
  ]);

  return NextResponse.json(updated);
}
