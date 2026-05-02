import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const videos = await prisma.video.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { sentences: true } } },
  });

  return NextResponse.json(videos);
}
