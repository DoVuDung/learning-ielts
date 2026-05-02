import { prisma } from "@/lib/prisma";
import { TopNav } from "@/components/top-nav";
import { FilterBar } from "@/components/filter-bar";
import { LessonGrid } from "@/components/lesson-grid";
import type { VideoCardProps } from "@/components/video-card";

function toCard(v: {
  id: string;
  title: string;
  thumbnailUrl: string;
  duration: number;
  level: string;
  createdAt: Date;
  _count: { sentences: number };
}): VideoCardProps {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  return {
    id: v.id,
    title: v.title,
    thumbnailUrl: v.thumbnailUrl,
    duration: v.duration,
    segments: v._count.sentences,
    level: v.level,
    isNew: v.createdAt > cutoff,
  };
}

export default async function DictationPage() {
  const videos = await prisma.video.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { sentences: true } } },
  });

  const byCategory = videos.reduce<Record<string, typeof videos>>((acc, v) => {
    (acc[v.category] ??= []).push(v);
    return acc;
  }, {});

  const recent = videos.slice(0, 10).map(toCard);
  const categories = Object.entries(byCategory).filter(([cat]) => cat !== "general");

  return (
    <>
      <TopNav
        title="Luyện Dictation"
        subtitle="Chọn video để luyện kỹ năng nghe"
        showStats
      />
      <main className="flex-1 overflow-y-auto px-6 py-6">
        <FilterBar />
        <div className="flex flex-col gap-10 mt-6">
          {recent.length > 0 && (
            <LessonGrid title="Mới nhất" lessons={recent} />
          )}
          {categories.map(([cat, vids]) => (
            <LessonGrid
              key={cat}
              title={cat}
              count={vids.length}
              lessons={vids.map(toCard)}
            />
          ))}
          {videos.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
              <p className="text-muted-foreground text-sm">Chưa có video nào.</p>
              <p className="text-muted-foreground text-xs">
                Vào <span className="text-primary font-medium">Video của tôi</span> để import video từ YouTube.
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
