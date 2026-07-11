import Link from "next/link";
import Image from "next/image";
import { Clock, Layers, Play } from "lucide-react";
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

const levelStyles: Record<string, string> = {
  A1: "bg-emerald-500/80 text-white border-emerald-400/30",
  A2: "bg-teal-500/80 text-white border-teal-400/30",
  B1: "bg-blue-500/80 text-white border-blue-400/30",
  B2: "bg-violet-500/80 text-white border-violet-400/30",
  C1: "bg-primary/90 text-white border-primary/40",
  C2: "bg-rose-600/90 text-white border-rose-400/40",
};

function fmtDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
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
      className="group flex flex-col gap-3 cursor-pointer"
    >
      <div className="relative rounded-2xl overflow-hidden aspect-video bg-card border border-border group-hover:border-primary/50 transition-all duration-300 shadow-sm group-hover:shadow-lg">
        <Image
          src={thumbnailUrl}
          alt={title}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 z-10 opacity-80 group-hover:opacity-90 transition-opacity" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 z-20 flex items-center gap-1.5">
          <span
            className={cn(
              "backdrop-blur-md text-[10px] font-bold px-2.5 py-0.5 rounded-full border shadow-sm",
              levelStyles[level] ?? "bg-card/80 text-foreground border-border",
            )}
          >
            {level}
          </span>
          {isNew && (
            <span className="bg-primary text-on-primary text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-sm animate-pulse">
              MỚI
            </span>
          )}
        </div>

        {/* Center Hover Play Button matching V3 */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 z-30 group-hover:scale-100 scale-90">
          <div className="size-12 rounded-full bg-primary/30 backdrop-blur-md border border-primary/60 flex items-center justify-center shadow-2xl">
            <Play className="size-5 text-primary fill-primary ml-0.5" />
          </div>
        </div>

        {/* Bottom Metadata */}
        <div className="absolute bottom-2.5 right-2.5 z-20 flex items-center gap-1 bg-black/75 backdrop-blur-md text-white text-[11px] font-medium px-2.5 py-0.5 rounded-full border border-white/10">
          <Clock className="size-3 text-primary" />
          <span>{fmtDuration(duration)}</span>
        </div>
      </div>

      <div className="flex flex-col gap-1.5 px-0.5">
        <h3 className="text-sm font-bold text-foreground line-clamp-2 leading-snug group-hover:text-primary transition-colors">
          {title}
        </h3>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Layers className="size-3.5 text-muted-foreground/80" />
            <span>{segments} câu</span>
          </span>
          <span className="size-1 rounded-full bg-border" />
          <span className="text-[11px] text-primary/90 font-medium">
            Dictation chuẩn AI
          </span>
        </div>
      </div>
    </Link>
  );
}
