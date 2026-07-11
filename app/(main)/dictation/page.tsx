import { prisma } from "@/lib/prisma";
import { TopNav } from "@/components/top-nav";
import { FilterBar } from "@/components/filter-bar";
import { LessonGrid } from "@/components/lesson-grid";
import type { VideoCardProps } from "@/components/video-card";
import { Suspense } from "react";

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

const LEVEL_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"];

interface PageProps {
  searchParams: Promise<{ category?: string; level?: string }>;
}

export default async function DictationPage({ searchParams }: PageProps) {
  const { category: catParam, level: levelParam } = await searchParams;
  const activeCategory = catParam && catParam !== "all" ? catParam : null;
  const activeLevel = levelParam && levelParam !== "all-levels" ? levelParam.toUpperCase() : null;

  let allVideos: { category: string; level: string }[] = [];
  let videos: {
    id: string;
    title: string;
    youtubeId: string;
    duration: number;
    level: string;
    category: string;
    thumbnailUrl: string;
    createdAt: Date;
    _count: { sentences: number };
  }[] = [];

  try {
    allVideos = await prisma.video.findMany({
      select: { category: true, level: true },
    });

    videos = await prisma.video.findMany({
      where: {
        ...(activeCategory ? { category: activeCategory } : {}),
        ...(activeLevel ? { level: activeLevel } : {}),
      },
      include: { _count: { select: { sentences: true } } },
    });
  } catch (err) {
    console.error("Database connection failed in dictation/page.tsx:", err);
  }

  const catCounts = allVideos.reduce<Record<string, number>>((acc, v) => {
    if (v.category && v.category !== "general") {
      acc[v.category] = (acc[v.category] ?? 0) + 1;
    }
    return acc;
  }, {});

  const categories = Object.entries(catCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([label, count]) => ({ id: label, label, count }));

  const levelCounts = allVideos.reduce<Record<string, number>>((acc, v) => {
    if (v.level) acc[v.level] = (acc[v.level] ?? 0) + 1;
    return acc;
  }, {});

  const levels = LEVEL_ORDER.filter((l) => levelCounts[l])
    .map((l) => ({ id: l.toLowerCase(), label: l, count: levelCounts[l] }));

  const byCategory = videos.reduce<Record<string, typeof videos>>((acc, v) => {
    (acc[v.category] ??= []).push(v);
    return acc;
  }, {});

  const recent = !activeCategory && !activeLevel ? videos.slice(0, 10).map(toCard) : [];
  const sections = Object.entries(byCategory).filter(([cat]) => cat !== "general");

  return (
    <>
      <TopNav title="Luyện Dictation" subtitle="Chọn bài học từ thư viện IELTS V3" showSearch showStats />
      <main className="flex-1 overflow-y-auto px-6 py-6">
        <Suspense>
          <FilterBar categories={categories} levels={levels} />
        </Suspense>
        <div className="flex flex-col gap-10 mt-6">
          {recent.length > 0 && <LessonGrid title="Mới nhất" lessons={recent} />}
          {sections.map(([cat, vids]) => (
            <LessonGrid key={cat} title={cat} count={vids.length} lessons={vids.map(toCard)} />
          ))}
          {videos.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
              <p className="text-muted-foreground text-sm">Không tìm thấy video nào.</p>
              <p className="text-muted-foreground text-xs">
                Thử bỏ bộ lọc hoặc vào{" "}
                <span className="text-primary font-medium">Video của tôi</span> để import video.
              </p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
