import Image from "next/image";
import { Clock, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface VideoCardProps {
  title: string;
  thumbnail: string;
  duration: string;
  segments: number;
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  isNew?: boolean;
  source?: string;
}

const levelColors: Record<string, string> = {
  A1: "bg-emerald-600",
  A2: "bg-teal-600",
  B1: "bg-blue-600",
  B2: "bg-violet-600",
  C1: "bg-rose-600",
  C2: "bg-red-700",
};

export function VideoCard({
  title,
  thumbnail,
  duration,
  segments,
  level,
  isNew,
}: VideoCardProps) {
  return (
    <div className="group flex flex-col gap-2 cursor-pointer">
      {/* Thumbnail */}
      <div className="relative rounded-xl overflow-hidden aspect-video bg-muted">
        <Image
          src={thumbnail}
          alt={title}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />

        {/* Top-left level badge */}
        <span
          className={cn(
            "absolute top-2 left-2 text-white text-[10px] font-bold px-1.5 py-0.5 rounded",
            levelColors[level] ?? "bg-muted"
          )}
        >
          {level}
        </span>

        {/* Top-right NEW badge */}
        {isNew && (
          <span className="absolute top-2 right-2 bg-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
            MỚI
          </span>
        )}

        {/* Bottom duration pill */}
        <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full">
          <Clock className="size-3" />
          {duration}
        </div>
      </div>

      {/* Meta */}
      <div className="flex flex-col gap-1 px-0.5">
        <h3 className="text-sm font-semibold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
          {title}
        </h3>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Layers className="size-3" />
          {segments} phần đoạn
        </div>
      </div>
    </div>
  );
}
