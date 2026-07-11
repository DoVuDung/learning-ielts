import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { VideoCard, type VideoCardProps } from "@/components/video-card";

interface LessonGridProps {
  title: string;
  count?: number;
  href?: string;
  lessons: VideoCardProps[];
}

export function LessonGrid({
  title,
  count,
  href,
  lessons,
}: Readonly<LessonGridProps>) {
  if (lessons.length === 0) return null;
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="size-2 rounded-full bg-primary" />
          <h2 className="text-lg font-black text-foreground tracking-tight">
            {title}
          </h2>
          {count !== undefined && (
            <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-bold text-primary border border-primary/20">
              {count}
            </span>
          )}
        </div>
        {href && (
          <Link
            href={href}
            className="group flex items-center gap-1.5 text-xs text-primary font-bold hover:underline transition-all"
          >
            <span>Xem thêm</span>
            <ArrowRight className="size-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {lessons.map((lesson) => (
          <VideoCard key={lesson.id} {...lesson} />
        ))}
      </div>
    </section>
  );
}
