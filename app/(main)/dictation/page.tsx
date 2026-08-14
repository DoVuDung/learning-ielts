import { prisma } from "@/lib/prisma";
import { TopNav } from "@/components/top-nav";
import { Suspense } from "react";
import { DictationClient } from "./dictation-client";

export const dynamic = "force-dynamic";

export default async function DictationPage() {
  let allVideos: any[] = [];

  try {
    allVideos = await prisma.video.findMany({
      include: { _count: { select: { sentences: true } } },
      orderBy: { createdAt: "desc" }
    });
  } catch (err) {
    console.error("Database connection failed in dictation/page.tsx:", err);
  }

  return (
    <>
      <TopNav title="Luyện Dictation" subtitle="Chọn bài học từ thư viện IELTS V3" showSearch showStats />
      <main className="flex-1 overflow-y-auto px-6 py-6">
        <Suspense>
          <DictationClient allVideos={allVideos} />
        </Suspense>
      </main>
    </>
  );
}
