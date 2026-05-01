import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { VideoCard, type VideoCardProps } from "@/components/video-card";

interface LessonGridProps {
  title: string;
  count?: number;
  href?: string;
  lessons: VideoCardProps[];
}

export function LessonGrid({ title, count, href, lessons }: LessonGridProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-foreground">
          {title}
          {count !== undefined && (
            <span className="ml-2 text-sm font-normal text-muted-foreground">{count}</span>
          )}
        </h2>
        {href && (
          <Link
            href={href}
            className="flex items-center gap-0.5 text-sm text-primary font-medium hover:underline"
          >
            Xem thêm
            <ChevronRight className="size-4" />
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {lessons.map((lesson, i) => (
          <VideoCard key={i} {...lesson} />
        ))}
      </div>
    </section>
  );
}
