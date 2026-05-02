"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, RefreshCw, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { Video, Sentence } from "@prisma/client";

interface Props {
  video: Video;
  sentences: Sentence[];
}

export function ShadowingPlayer({ video, sentences }: Props) {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [showText, setShowText] = useState(false);
  const [hideAll, setHideAll] = useState(false);
  const playerRef = useRef<HTMLIFrameElement>(null);

  const sentence = sentences[current];
  const progress = Math.round((done.size / sentences.length) * 100);

  const seekTo = useCallback((ms: number) => {
    playerRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func: "seekTo", args: [Math.floor(ms / 1000), true] }),
      "*"
    );
  }, []);

  function replay() {
    seekTo(sentence.startMs);
  }

  function markDone() {
    setDone((prev) => new Set([...prev, current]));
    if (current < sentences.length - 1) {
      const next = current + 1;
      setCurrent(next);
      setShowText(false);
      setTimeout(() => seekTo(sentences[next].startMs), 100);
    }
  }

  function goTo(i: number) {
    setCurrent(i);
    setShowText(false);
    seekTo(sentences[i].startMs);
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: player */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10 shrink-0">
          <Button variant="ghost" size="icon" className="size-8" onClick={() => router.back()}>
            <ChevronLeft className="size-4" />
          </Button>
          <p className="text-sm font-semibold flex-1 truncate">{video.title}</p>
          <span className="text-xs text-muted-foreground shrink-0">{done.size}/{sentences.length}</span>
          <div className="w-28">
            <Progress value={progress} className="h-1.5" />
          </div>
          <span className="text-xs text-primary font-medium shrink-0">{progress}%</span>
        </header>

        {/* YouTube */}
        <div className="relative w-full aspect-video bg-black shrink-0">
          <iframe
            ref={playerRef}
            src={`https://www.youtube.com/embed/${video.youtubeId}?enablejsapi=1&rel=0&modestbranding=1`}
            className="absolute inset-0 size-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Sentence display */}
        <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-6">
          {/* Step indicator */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center justify-center size-5 rounded-full bg-primary text-white font-bold text-[10px]">1</span>
            Nghe câu #{current + 1}
            <span className="flex items-center justify-center size-5 rounded-full bg-white/10 font-bold text-[10px]">2</span>
            Lặp lại theo
            <span className="flex items-center justify-center size-5 rounded-full bg-white/10 font-bold text-[10px]">3</span>
            Đánh dấu xong
          </div>

          {/* Sentence card */}
          <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Câu #{current + 1}/{sentences.length}</span>
              <button
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                onClick={() => setShowText((v) => !v)}
              >
                {showText ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                {showText ? "Ẩn văn bản" : "Xem văn bản"}
              </button>
            </div>

            {showText ? (
              <p className="text-base text-foreground leading-relaxed">{sentence.text}</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {sentence.text.split(" ").map((_, i) => (
                  <span key={i} className="h-4 rounded bg-white/10" style={{ width: `${Math.max(Math.random() * 60 + 30, 30)}px` }} />
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" className="gap-2" onClick={replay}>
              <RefreshCw className="size-3.5" />
              Nghe lại
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowText((v) => !v)}>
              {showText ? "Ẩn văn bản" : "Xem văn bản"}
            </Button>
            <div className="ml-auto flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => goTo(Math.max(0, current - 1))} disabled={current === 0}>
                <ChevronLeft className="size-4" />
              </Button>
              <Button size="sm" className="gap-2" onClick={markDone}>
                <CheckCircle2 className="size-4" />
                Xong, tiếp theo
              </Button>
            </div>
          </div>

          {/* Tips */}
          <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-3">
            <p className="text-xs text-primary font-medium mb-1">Mẹo luyện shadowing</p>
            <ul className="text-xs text-muted-foreground flex flex-col gap-1">
              <li>• Nghe toàn bộ câu trước, đừng dừng lại</li>
              <li>• Lặp lại ngay sau khi nghe, chú ý ngữ điệu và nhịp</li>
              <li>• Không cần phát âm hoàn hảo — tập trung vào luồng nói tự nhiên</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Right: transcript */}
      <aside className="w-72 shrink-0 border-l border-border flex flex-col overflow-hidden bg-card">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <span className="text-sm font-semibold">Transcript</span>
          <button className="text-xs text-muted-foreground hover:text-foreground" onClick={() => setHideAll((v) => !v)}>
            {hideAll ? "Hiện tất cả" : "Ẩn tất cả"}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {sentences.map((s, i) => {
            const isCurrent = i === current;
            const isDone = done.has(i);
            return (
              <button
                key={s.id}
                onClick={() => goTo(i)}
                className={cn(
                  "w-full text-left px-4 py-3 flex gap-3 transition-colors border-l-2",
                  isCurrent ? "border-primary bg-primary/10" : "border-transparent hover:bg-white/5"
                )}
              >
                <div className={cn(
                  "size-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5",
                  isCurrent ? "border-primary" : isDone ? "border-emerald-500 bg-emerald-500" : "border-border"
                )}>
                  {isDone && <CheckCircle2 className="size-3 text-white" />}
                </div>
                <p className={cn(
                  "text-xs leading-relaxed",
                  hideAll && !isCurrent && !isDone ? "blur-sm select-none" : "text-foreground"
                )}>
                  {s.text}
                </p>
              </button>
            );
          })}
        </div>
        <div className="px-4 py-3 border-t border-border shrink-0">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>Tiến độ</span><span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      </aside>
    </div>
  );
}
