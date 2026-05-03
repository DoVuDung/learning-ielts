"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  RefreshCw,
  CheckCircle2,
  EyeOff,
  GripHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { WordRevealChips } from "@/components/word-reveal-chips";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/locale-context";
import type { Video, Sentence } from "@prisma/client";

const MIN_VIDEO_H = 120;
const MAX_VIDEO_H = 480;
const DEFAULT_VIDEO_H = 180;

interface Props {
  video: Video;
  sentences: Sentence[];
}

export function ShadowingPlayer({ video, sentences }: Readonly<Props>) {
  const router = useRouter();
  const { locale, setLocale, t } = useLocale();
  const [current, setCurrent] = useState(0);
  const [done, setDone] = useState<Set<number>>(new Set());
  const [forceReveal, setForceReveal] = useState(false);
  const [allRevealed, setAllRevealed] = useState(false);
  const [hideAll, setHideAll] = useState(false);
  const [videoH, setVideoH] = useState(DEFAULT_VIDEO_H);
  const [isDragging, setIsDragging] = useState(false);
  const dragging = useRef(false);
  const startY = useRef(0);
  const startH = useRef(DEFAULT_VIDEO_H);
  const playerRef = useRef<HTMLIFrameElement>(null);
  const activeTranscriptRef = useRef<HTMLButtonElement>(null);

  const sentence = sentences[current];
  const progress = Math.round((done.size / sentences.length) * 100);

  // Reset reveal state + scroll active transcript item into view when sentence changes
  useEffect(() => {
    setForceReveal(false);
    setAllRevealed(false);
    activeTranscriptRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [current]);

  const seekTo = useCallback((ms: number) => {
    playerRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func: "seekTo", args: [Math.floor(ms / 1000), true] }),
      "https://www.youtube.com",
    );
  }, []);

  // Drag-to-resize — overlay blocks iframe from stealing pointer events
  function onDragStart(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    dragging.current = true;
    setIsDragging(true);
    startY.current = "touches" in e ? e.touches[0].clientY : e.clientY;
    startH.current = videoH;
  }

  useEffect(() => {
    function onMove(e: MouseEvent | TouchEvent) {
      if (!dragging.current) return;
      const y = "touches" in e ? e.touches[0].clientY : e.clientY;
      setVideoH(Math.min(MAX_VIDEO_H, Math.max(MIN_VIDEO_H, startH.current + y - startY.current)));
    }
    function onUp() {
      if (!dragging.current) return;
      dragging.current = false;
      setIsDragging(false);
    }
    globalThis.addEventListener("mousemove", onMove);
    globalThis.addEventListener("mouseup", onUp);
    globalThis.addEventListener("touchmove", onMove, { passive: true });
    globalThis.addEventListener("touchend", onUp);
    return () => {
      globalThis.removeEventListener("mousemove", onMove);
      globalThis.removeEventListener("mouseup", onUp);
      globalThis.removeEventListener("touchmove", onMove);
      globalThis.removeEventListener("touchend", onUp);
    };
  }, []);

  function replay() {
    seekTo(sentence.startMs);
  }

  function markDone() {
    setDone((prev) => new Set([...prev, current]));
    if (current < sentences.length - 1) {
      const next = current + 1;
      setCurrent(next);
      setTimeout(() => seekTo(sentences[next].startMs), 100);
    }
  }

  function goTo(i: number) {
    setCurrent(i);
    seekTo(sentences[i].startMs);
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Left ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background/80 backdrop-blur-sm shrink-0">
          <Button variant="ghost" size="icon" className="size-8" onClick={() => router.back()}>
            <ChevronLeft className="size-4" />
          </Button>
          <p className="text-sm font-semibold flex-1 truncate">{video.title}</p>
          <span className="text-xs text-muted-foreground shrink-0">{done.size}/{sentences.length}</span>
          <div className="w-28">
            <Progress value={progress} className="h-1.5" />
          </div>
          <span className="text-xs text-primary font-medium shrink-0">{progress}%</span>
          <button
            onClick={() => setLocale(locale === "en" ? "vi" : "en")}
            className="text-xs font-bold px-2 py-1 rounded border border-border hover:bg-white/5 transition-colors shrink-0"
            aria-label="Toggle language"
          >
            {locale === "en" ? "EN" : "VI"}
          </button>
        </header>

        {/* YouTube */}
        <div className="relative w-full bg-black shrink-0" style={{ height: `${videoH}px` }}>
          <iframe
            ref={playerRef}
            src={`https://www.youtube.com/embed/${video.youtubeId}?enablejsapi=1&rel=0&modestbranding=1`}
            title={video.title}
            className="absolute inset-0 size-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
          {isDragging && <div className="absolute inset-0 z-10 cursor-row-resize" />}
        </div>

        {/* Drag handle */}
        <div
          onMouseDown={onDragStart}
          onTouchStart={onDragStart}
          className="group flex items-center justify-center h-4 shrink-0 bg-background border-y border-border cursor-row-resize select-none hover:bg-primary/10 active:bg-primary/20 transition-colors"
        >
          <div className="flex items-center gap-1.5">
            <GripHorizontal className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
            <span className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors leading-none">
              {t.dragResize}
            </span>
          </div>
        </div>

        {/* Sentence area */}
        <div className="flex-1 px-6 py-5 flex flex-col gap-5 min-h-0 overflow-y-auto">
          {/* Step pills */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0">
            {[
              { n: 1, label: t.step1 },
              { n: 2, label: t.step2 },
              { n: 3, label: t.step3 },
            ].map(({ n, label }) => (
              <span key={n} className="flex items-center gap-1.5">
                <span className={cn(
                  "flex items-center justify-center size-5 rounded-full font-bold text-[10px]",
                  n === 1 ? "bg-primary text-white" : "bg-white/10 text-muted-foreground",
                )}>
                  {n}
                </span>
                {label}
              </span>
            ))}
          </div>

          {/* Word chips card */}
          <div className="rounded-xl border border-border bg-card p-5 shrink-0">
            <WordRevealChips
              text={sentence.text}
              forceReveal={forceReveal}
              sentenceIndex={current}
              sentenceTotal={sentences.length}
              onAllRevealed={() => setAllRevealed(true)}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-3 shrink-0">
            <Button variant="outline" size="sm" className="gap-2" onClick={replay}>
              <RefreshCw className="size-3.5" /> {t.replay}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => setForceReveal(true)}
              disabled={forceReveal}
            >
              <EyeOff className="size-3.5" /> {t.revealAll}
            </Button>
            <div className="ml-auto flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => goTo(Math.max(0, current - 1))}
                disabled={current === 0}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                size="sm"
                className={cn("gap-2 transition-all", allRevealed && "ring-2 ring-primary/40")}
                onClick={markDone}
              >
                <CheckCircle2 className="size-4" /> {t.doneNext}
              </Button>
            </div>
          </div>

          {/* Tips */}
          <div className="rounded-lg bg-primary/5 border border-primary/20 px-4 py-3 mt-auto shrink-0">
            <p className="text-xs text-primary font-medium mb-1">{t.howToPractice}</p>
            <ul className="text-xs text-muted-foreground flex flex-col gap-1">
              <li>• {t.tip1}</li>
              <li>• {t.tip2}</li>
              <li>• {t.tip3Pre} <span className="text-foreground font-medium">{t.doneNext}</span> {t.tip3Post}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── Right: transcript ── */}
      <aside className="w-72 shrink-0 border-l border-border flex flex-col overflow-hidden bg-card">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <span className="text-sm font-semibold">{t.transcript}</span>
          <button
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setHideAll((v) => !v)}
          >
            {hideAll ? t.showAll : t.hideAll}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {sentences.map((s, i) => {
            const isCurrent = i === current;
            const isDone = done.has(i);
            let dotClass = "border-border";
            if (isCurrent) dotClass = "border-primary";
            else if (isDone) dotClass = "border-emerald-500 bg-emerald-500";

            return (
              <button
                key={s.id}
                ref={isCurrent ? activeTranscriptRef : null}
                onClick={() => goTo(i)}
                className={cn(
                  "w-full text-left px-4 py-3 flex gap-3 transition-colors border-l-2",
                  isCurrent ? "border-primary bg-primary/10" : "border-transparent hover:bg-white/5",
                )}
              >
                <div className={cn(
                  "size-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5",
                  dotClass,
                )}>
                  {isDone && <CheckCircle2 className="size-3 text-white" />}
                </div>
                <p className={cn(
                  "text-xs leading-relaxed",
                  hideAll && !isCurrent && !isDone ? "blur-sm select-none" : "text-foreground",
                )}>
                  {s.text}
                </p>
              </button>
            );
          })}
        </div>
        <div className="px-4 py-3 border-t border-border shrink-0">
          <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
            <span>{t.progress}</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
      </aside>
    </div>
  );
}
