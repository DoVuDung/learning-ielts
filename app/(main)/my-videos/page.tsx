import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { TopNav } from "@/components/top-nav";
import { LessonGrid } from "@/components/lesson-grid";
import { ImportVideoForm } from "./import-video-form";
import type { VideoCardProps } from "@/components/video-card";

export default async function MyVideosPage() {
  const session = await getSession();

  const videos = session
    ? await prisma.video.findMany({
        where: { createdById: session.sub },
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { sentences: true } } },
      })
    : [];

  const cards: VideoCardProps[] = videos.map((v) => ({
    id: v.id,
    title: v.title,
    thumbnailUrl: v.thumbnailUrl,
    duration: v.duration,
    segments: v._count.sentences,
    level: v.level,
  }));

  return (
    <>
      <TopNav title="Video của tôi" subtitle="Import và quản lý video YouTube của bạn" />
      <main className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-8">
        <ImportVideoForm />
        {cards.length > 0 ? (
          <LessonGrid title="Video đã import" count={cards.length} lessons={cards} />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <p className="text-muted-foreground text-sm">Chưa có video nào.</p>
            <p className="text-xs text-muted-foreground">Dán link YouTube ở trên để bắt đầu.</p>
          </div>
        )}
      </main>
    </>
  );
}
