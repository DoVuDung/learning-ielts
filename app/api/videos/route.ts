import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const videos = await prisma.video.findMany({
    where: { createdById: session.sub },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { sentences: true } } },
  });

  return NextResponse.json(videos);
}
