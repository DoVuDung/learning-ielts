import Link from "next/link";
import Image from "next/image";
import { Clock, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

export interface VideoCardProps {
  id: string;
  title: string;
  thumbnailUrl: string;
  duration: number; // seconds
  segments: number;
  level: string;
  isNew?: boolean;
  href?: string; // override default /dictation/[id]
}

const levelColors: Record<string, string> = {
  A1: "bg-emerald-600",
  A2: "bg-teal-600",
  B1: "bg-blue-600",
  B2: "bg-violet-600",
  C1: "bg-rose-600",
  C2: "bg-red-700",
};

function fmtDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  return `${m} phút`;
}

export function VideoCard({
  id,
  title,
  thumbnailUrl,
  duration,
  segments,
  level,
  isNew,
  href,
}: Readonly<VideoCardProps>) {
  return (
    <Link
      href={href ?? `/dictation/${id}`}
      className="group flex flex-col gap-2 cursor-pointer"
    >
      <div className="relative rounded-xl overflow-hidden aspect-video bg-muted">
        <Image
          src={thumbnailUrl}
          alt={title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />
        <span
          className={cn(
            "absolute top-2 left-2 text-white text-[10px] font-bold px-1.5 py-0.5 rounded",
            levelColors[level] ?? "bg-muted",
          )}
        >
          {level}
        </span>
        {isNew && (
          <span className="absolute top-2 right-2 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
            MỚI
          </span>
        )}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full">
          <Clock className="size-3" />
          {fmtDuration(duration)}
        </div>
      </div>
      <div className="flex flex-col gap-1 px-0.5">
        <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
          {title}
        </h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Layers className="size-3" />
          {segments} phần đoạn
        </div>
      </div>
    </Link>
  );
}
