import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ShadowingPlayer } from "./shadowing-player";

interface Props {
  params: Promise<{ videoId: string }>;
}

export default async function ShadowingVideoPage({ params }: Props) {
  const { videoId } = await params;

  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: { sentences: { orderBy: { index: "asc" } } },
  });

  if (!video) notFound();

  return <ShadowingPlayer video={video} sentences={video.sentences} />;
}
