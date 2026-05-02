import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { DictationPlayer } from "./dictation-player";

interface Props {
  params: Promise<{ videoId: string }>;
}

export default async function DictationVideoPage({ params }: Props) {
  const { videoId } = await params;

  const video = await prisma.video.findUnique({
    where: { id: videoId },
    include: { sentences: { orderBy: { index: "asc" } } },
  });

  if (!video) notFound();

  const session = await getSession();
  const savedProgress = session
    ? await prisma.dictationProgress.findUnique({
        where: { userId_videoId: { userId: session.sub, videoId } },
      })
    : null;

  return (
    <DictationPlayer
      video={video}
      sentences={video.sentences}
      initialDone={savedProgress?.sentencesDone ?? 0}
    />
  );
}
