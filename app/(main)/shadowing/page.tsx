import { prisma } from "@/lib/prisma";
import { TopNav } from "@/components/top-nav";
import { LessonGrid } from "@/components/lesson-grid";
import type { VideoCardProps } from "@/components/video-card";

export default async function ShadowingPage() {
  const videos = await prisma.video.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { sentences: true } } },
  });

  const cards: VideoCardProps[] = videos.map((v) => ({
    id: v.id,
    title: v.title,
    thumbnailUrl: v.thumbnailUrl,
    duration: v.duration,
    segments: v._count.sentences,
    level: v.level,
    href: `/shadowing/${v.id}`,
  }));

  return (
    <>
      <TopNav title="Luyện Shadowing" subtitle="Nghe và lặp lại để cải thiện phát âm" />
      <main className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-8">
        {cards.length > 0 ? (
          <LessonGrid title="Chọn video để luyện" lessons={cards} />
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
            <p className="text-muted-foreground text-sm">Chưa có video nào.</p>
            <p className="text-xs text-muted-foreground">
              Import video tại <span className="text-primary font-medium">Video của tôi</span> để bắt đầu.
            </p>
          </div>
        )}
      </main>
    </>
  );
}
