"use client";

import { wordsApi, progressApi } from "@/lib/api-client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Eye,
  CheckCircle2,
  BookmarkPlus,
  GripHorizontal,
  Lightbulb,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { TranscriptSidebar } from "@/components/transcript-sidebar";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/locale-context";
import type { Messages } from "@/lib/i18n";
import type { Video, Sentence } from "@prisma/client";

// ─── constants ───────────────────────────────────────────────────────────────
const MIN_H = 120;
const MAX_H = 420;
const DEFAULT_H = 200;

// ─── helpers ─────────────────────────────────────────────────────────────────
export function clean(s: string) {
  return s.toLowerCase().replaceAll(/[^a-z0-9]/g, "");
}

const NUMBER_WORDS: Record<string, string> = {
  zero: "0", one: "1", two: "2", three: "3", four: "4", five: "5",
  six: "6", seven: "7", eight: "8", nine: "9", ten: "10",
  eleven: "11", twelve: "12", thirteen: "13", fourteen: "14", fifteen: "15",
  sixteen: "16", seventeen: "17", eighteen: "18", nineteen: "19",
  twenty: "20", thirty: "30", forty: "40", fifty: "50",
  sixty: "60", seventy: "70", eighty: "80", ninety: "90",
  hundred: "100", thousand: "1000", million: "1000000",
};

/** Normalize a single token for comparison: strip punctuation, collapse number forms */
export function normalize(s: string): string {
  const lower = s.toLowerCase().replace(/,/g, "").replace(/[^a-z0-9]/g, "");
  return NUMBER_WORDS[lower] ?? lower;
}

export function splitWords(text: string): string[] {
  return text.trim().split(/\s+/);
}

/** Split user's raw input into [completedWords, currentPartial] */
export function parseInput(raw: string): { done: string[]; partial: string } {
  if (raw.endsWith(" ")) {
    return { done: raw.trim().split(/\s+/).filter(Boolean), partial: "" };
  }
  const words = raw.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return { done: [], partial: "" };
  return { done: words.slice(0, -1), partial: words[words.length - 1] };
}

type WordStatus = "pending" | "correct" | "wrong" | "active" | "revealed";

interface WordState {
  expected: string;
  typed: string;
  status: WordStatus;
}

// ─── VocabPopover ─────────────────────────────────────────────────────────────
interface VocabPopoverProps {
  word: string;
  context: string;
  videoId: string;
  x: number;
  y: number;
  t: Messages;
  onSaved: (word: string) => void;
  onClose: () => void;
}

function VocabPopover({
  word,
  context,
  videoId,
  x,
  y,
  t,
  onSaved,
  onClose,
}: VocabPopoverProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    await wordsApi.save({ word: word.toLowerCase(), context, videoId });
    setSaved(true);
    setSaving(false);
    onSaved(word);
    setTimeout(onClose, 800);
  }

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 rounded-xl border border-border bg-card shadow-2xl shadow-black/40 p-3 flex flex-col gap-2 min-w-45"
        style={{ left: x, top: y }}
      >
        <p className="text-xs text-muted-foreground">{t.addVocab}</p>
        <p className="text-sm font-semibold text-foreground">&ldquo;{word}&rdquo;</p>
        {saved ? (
          <p className="text-xs text-emerald-400 flex items-center gap-1">
            <CheckCircle2 className="size-3" /> {t.saved}
          </p>
        ) : (
          <Button
            size="sm"
            className="gap-1.5 h-7 text-xs"
            onClick={save}
            disabled={saving}
          >
            <BookmarkPlus className="size-3" />
            {saving ? t.saving : t.saveBtn}
          </Button>
        )}
      </div>
    </>
  );
}

// ─── WordGrid ─────────────────────────────────────────────────────────────────
interface WordGridProps {
  words: WordState[];
  savedWords: Set<string>;
  context: string;
  videoId: string;
  t: Messages;
  checked: boolean;
  onSaved: (word: string) => void;
}

function WordGrid({
  words,
  savedWords,
  context,
  videoId,
  t,
  checked,
  onSaved,
}: WordGridProps) {
  const [popover, setPopover] = useState<{
    word: string;
    x: number;
    y: number;
  } | null>(null);

  function handleWordClick(
    e: React.MouseEvent,
    word: string,
    status: WordStatus,
  ) {
    if (status === "pending" || status === "active") return;
    const bare = clean(word);
    if (!bare) return;
    const rect = (e.target as HTMLElement).getBoundingClientRect();
    setPopover({ word: bare, x: rect.left, y: rect.bottom + 6 });
  }

  return (
    <div className="flex flex-wrap gap-x-2 gap-y-2.5 select-none">
      {words.map((w, i) => {
        const isSaved = savedWords.has(clean(w.expected));
        return (
          <span
            key={`${i}-${w.expected}`}
            onClick={(e) => handleWordClick(e, w.expected, w.status)}
            className={cn(
              "relative inline-flex flex-col items-center gap-0.5 cursor-default transition-all",
              (w.status === "correct" ||
                w.status === "wrong" ||
                w.status === "revealed") &&
                "cursor-pointer",
            )}
          >
            {/* typed word above */}
            <span
              className={cn(
                "text-sm font-mono font-medium leading-tight min-h-5",
                w.status === "correct" && "text-emerald-400",
                w.status === "wrong" && "text-rose-400 line-through",
                w.status === "active" && "text-primary",
                w.status === "pending" && "text-transparent",
                w.status === "revealed" && "text-amber-400",
              )}
            >
              {w.status === "active"
                ? w.typed || " "
                : w.status === "pending"
                  ? " "
                  : w.typed || w.expected}
            </span>

            {/* expected word bar below */}
            <span
              className={cn(
                "text-xs leading-tight px-1.5 py-0.5 rounded font-medium border transition-all",
                w.status === "pending" &&
                  "bg-white/5 border-border text-transparent",
                w.status === "active" &&
                  "bg-primary/10 border-primary/40 text-transparent",
                w.status === "correct" &&
                  "bg-emerald-500/10 border-emerald-500/30 text-emerald-400",
                w.status === "wrong" && !checked &&
                  "bg-rose-500/10 border-rose-500/30 text-transparent",
                w.status === "wrong" && checked &&
                  "bg-rose-500/10 border-rose-500/30 text-rose-300",
                w.status === "revealed" &&
                  "bg-amber-500/10 border-amber-500/30 text-amber-300",
              )}
              style={{
                minWidth: `${Math.max(clean(w.expected).length * 8, 20)}px`,
              }}
            >
              {w.status === "pending" || w.status === "active" || (w.status === "wrong" && !checked)
                ? "•".repeat(Math.max(clean(w.expected).length, 1))
                : w.expected}
            </span>

            {/* saved dot */}
            {isSaved && w.status !== "pending" && (
              <span className="absolute -top-1 -right-1 size-1.5 rounded-full bg-primary" />
            )}
          </span>
        );
      })}

      {popover && (
        <VocabPopover
          word={popover.word}
          context={context}
          videoId={videoId}
          x={popover.x}
          y={popover.y}
          t={t}
          onSaved={onSaved}
          onClose={() => setPopover(null)}
        />
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
interface Props {
  video: Video;
  sentences: Sentence[];
  initialDone: number;
}

export function DictationPlayer({ video, sentences, initialDone }: Props) {
  const router = useRouter();
  const { t } = useLocale();
  const [current, setCurrent] = useState(
    initialDone < sentences.length ? initialDone : 0,
  );
  const [raw, setRaw] = useState("");
  const [checked, setChecked] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [autoNext, setAutoNext] = useState(false);
  const [hideTranscript, setHideTranscript] = useState(false);
  const [done, setDone] = useState(initialDone);
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());
  const [videoH, setVideoH] = useState(DEFAULT_H);
  const [isDragging, setIsDragging] = useState(false);
  const transcriptItemRef = useRef<HTMLButtonElement>(null);

  const inputRef = useRef<HTMLTextAreaElement>(null);
  const playerRef = useRef<HTMLIFrameElement>(null);
  const sentencesRef = useRef(sentences);
  sentencesRef.current = sentences;
  const dragging = useRef(false);
  const startY = useRef(0);
  const startH = useRef(DEFAULT_H);
  const autoNextTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoPauseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sentence = sentences[current];
  const expectedWords = splitWords(sentence.text);
  const progress = Math.round((done / sentences.length) * 100);

  // ── Build word states from raw input ─────────────────────────────────────
  const wordStates: WordState[] = (() => {
    if (revealed) {
      return expectedWords.map((w) => ({
        expected: w,
        typed: w,
        status: "revealed",
      }));
    }
    const { done: typedDone, partial } = parseInput(raw);

    return expectedWords.map((expected, i): WordState => {
      if (i < typedDone.length) {
        const typed = typedDone[i] ?? "";
        const status: WordStatus =
          normalize(typed) === normalize(expected) ? "correct" : "wrong";
        return { expected, typed, status };
      }
      if (i === typedDone.length && (partial || raw.length > 0)) {
        return { expected, typed: partial, status: "active" };
      }
      return { expected, typed: "", status: "pending" };
    });
  })();

  const correctCount = wordStates.filter((w) => w.status === "correct").length;
  const allCorrect = !revealed && correctCount === expectedWords.length;

  // ── Player commands ────────────────────────────────────────────────────
  const sendCommand = useCallback((func: string, args: unknown[] = []) => {
    playerRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func, args }),
      "https://www.youtube.com",
    );
  }, []);

  const seekTo = useCallback((ms: number) => {
    sendCommand("seekTo", [Math.floor(ms / 1000), true]);
  }, [sendCommand]);

  /** Schedule auto-pause at the end of a sentence */
  const scheduleAutoPause = useCallback((s: typeof sentence) => {
    if (autoPauseTimer.current) clearTimeout(autoPauseTimer.current);
    const duration = s.endMs - s.startMs;
    if (duration > 0) {
      autoPauseTimer.current = setTimeout(() => {
        sendCommand("pauseVideo");
      }, duration + 300);
    }
  }, [sendCommand]);

  // ── Navigate to sentence (resets all input state) ─────────────────────
  function goTo(index: number) {
    if (autoNextTimer.current) clearTimeout(autoNextTimer.current);
    if (autoPauseTimer.current) clearTimeout(autoPauseTimer.current);
    setCurrent(index);
    setRaw("");
    setChecked(false);
    setRevealed(false);
    const s = sentences[index];
    seekTo(s.startMs);
    scheduleAutoPause(s);
    requestAnimationFrame(() => {
      transcriptItemRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
      inputRef.current?.focus();
    });
  }

  function replay() {
    seekTo(sentence.startMs);
    scheduleAutoPause(sentence);
    inputRef.current?.focus();
  }

  function goNext() {
    if (current < sentences.length - 1) goTo(current + 1);
  }

  function goPrev() {
    if (current > 0) goTo(current - 1);
  }

  function revealAll() {
    setRevealed(true);
    setRaw("");
  }

  function saveProgress(sentencesDone: number) {
    progressApi.upsert({
      videoId: video.id,
      sentencesDone,
      totalSentences: sentences.length,
    });
  }

  function revealNext() {
    const { done: typedDone } = parseInput(raw);
    const firstBad = wordStates.findIndex(
      (w, i) =>
        i <= typedDone.length &&
        (w.status === "wrong" || w.status === "pending"),
    );
    if (firstBad === -1) return;
    const words = raw.trim().split(/\s+/).filter(Boolean);
    words[firstBad] = expectedWords[firstBad];
    setRaw(words.join(" ") + " ");
  }

  // ── Drag resize ────────────────────────────────────────────────────────
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
      setVideoH(
        Math.min(MAX_H, Math.max(MIN_H, startH.current + y - startY.current)),
      );
    }
    function onUp() {
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

  // ── Subscribe to YouTube time updates to sync transcript sidebar ──────
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (!playerRef.current || e.source !== playerRef.current.contentWindow) return;
      let data: Record<string, unknown>;
      try { data = JSON.parse(e.data as string); } catch { return; }

      if (data.event === "onReady") {
        playerRef.current.contentWindow?.postMessage(
          JSON.stringify({ event: "listening" }),
          "https://www.youtube.com",
        );
      }

      if (data.event === "infoDelivery") {
        const info = data.info as Record<string, unknown> | undefined;
        const sec = info?.currentTime as number | undefined;
        if (sec == null) return;
        const ms = sec * 1000;
        const list = sentencesRef.current;
        for (let i = list.length - 1; i >= 0; i--) {
          if (ms >= list[i].startMs) {
            setCurrent((prev) => (prev === i ? prev : i));
            break;
          }
        }
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // ── Keyboard ───────────────────────────────────────────────────────────
  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Tab") {
      e.preventDefault();
      replay();
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (allCorrect || revealed) goNext();
      else setChecked(true);
    }
  }

  function onSaved(word: string) {
    setSavedWords((prev) => new Set([...prev, word]));
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    if (revealed) return;
    const next = e.target.value;
    setRaw(next);
    setChecked(false);

    const { done: typedDone } = parseInput(next);
    const justAllCorrect =
      typedDone.length === expectedWords.length &&
      next.endsWith(" ") &&
      typedDone.every((w, i) => normalize(w) === normalize(expectedWords[i]));

    if (justAllCorrect) {
      if (current + 1 > done) {
        const nextDone = current + 1;
        setDone(nextDone);
        saveProgress(nextDone);
      }
      if (autoNext) {
        autoNextTimer.current = setTimeout(goNext, 1200);
      }
    }
  }

  const hasWrong = wordStates.some((w) => w.status === "wrong");
  const typedCount = wordStates.filter(
    (w) => w.status === "correct" || w.status === "wrong",
  ).length;

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Left ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background/80 backdrop-blur-sm shrink-0">
          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            onClick={() => router.back()}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <p className="text-sm font-semibold flex-1 truncate">{video.title}</p>
          <span className="text-xs text-muted-foreground shrink-0">
            {done}/{sentences.length}
          </span>
          <div className="w-28 shrink-0">
            <Progress value={progress} className="h-1.5" />
          </div>
          <span className="text-xs text-primary font-medium shrink-0">
            {progress}%
          </span>
        </header>

        {/* YouTube */}
        <div
          className="relative w-full bg-black shrink-0"
          style={{ height: `${videoH}px` }}
        >
          <iframe
            ref={playerRef}
            src={`https://www.youtube.com/embed/${video.youtubeId}?enablejsapi=1&rel=0&modestbranding=1`}
            title={video.title}
            className="absolute inset-0 size-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
          {isDragging && (
            <div className="absolute inset-0 z-10 cursor-row-resize" />
          )}
        </div>

        {/* Drag handle */}
        <div
          onMouseDown={onDragStart}
          onTouchStart={onDragStart}
          className="group flex items-center justify-center h-4 shrink-0 bg-background border-y border-border cursor-row-resize select-none hover:bg-primary/10 active:bg-primary/20 transition-colors"
        >
          <GripHorizontal className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>

        {/* Controls bar */}
        <div className="flex items-center gap-3 px-4 py-1.5 border-b border-border bg-card shrink-0 text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">
            #{current + 1}/{sentences.length}
          </span>
          <span
            className={cn(
              "font-mono tabular-nums",
              typedCount === expectedWords.length
                ? "text-emerald-400"
                : "text-foreground",
            )}
          >
            {typedCount}/{expectedWords.length} {t.wordCountUnit}
          </span>
          <span className="text-muted-foreground/50">·</span>
          <kbd className="px-1 py-0.5 rounded bg-white/5 border border-border font-mono text-[10px]">
            Tab
          </kbd>
          <span>{t.replayShortcut}</span>
          <kbd className="px-1 py-0.5 rounded bg-white/5 border border-border font-mono text-[10px]">
            Enter
          </kbd>
          <span>{t.nextShortcut}</span>
          <div className="ml-auto flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <Switch
                checked={autoNext}
                onCheckedChange={setAutoNext}
                className="scale-75"
              />
              <span>{t.autoNext}</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <Switch
                checked={hideTranscript}
                onCheckedChange={setHideTranscript}
                className="scale-75"
              />
              <span>{t.hideTranscriptLabel}</span>
            </label>
          </div>
        </div>

        {/* Main area */}
        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-4 min-h-0">
          {/* Word-by-word display */}
          <div
            className={cn(
              "rounded-xl border-2 p-5 flex flex-col gap-4 transition-colors",
              allCorrect && "border-emerald-500/50 bg-emerald-500/5",
              revealed && "border-amber-500/40 bg-amber-500/5",
              checked && hasWrong && "border-rose-500/40 bg-rose-500/5",
              !allCorrect &&
                !revealed &&
                !(checked && hasWrong) &&
                "border-primary/30 bg-card",
            )}
          >
            {/* Legend */}
            <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-sm bg-emerald-500/40" /> {t.legendCorrect}
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-sm bg-rose-500/40" /> {t.legendWrong}
              </span>
              <span className="flex items-center gap-1">
                <span className="size-2 rounded-sm bg-primary/30" /> {t.legendTyping}
              </span>
              <span className="ml-auto text-[10px] text-muted-foreground/60 italic">
                {t.saveHint}
              </span>
            </div>

            {/* Word chips */}
            <WordGrid
              words={wordStates}
              savedWords={savedWords}
              context={sentence.text}
              videoId={video.id}
              t={t}
              checked={checked}
              onSaved={onSaved}
            />

            {/* Status messages */}
            {allCorrect && (
              <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium pt-1 border-t border-emerald-500/20">
                <CheckCircle2 className="size-4" />
                {t.correctMsg}{" "}
                {autoNext ? t.autoNextMsg : t.pressEnterMsg}
              </div>
            )}
            {revealed && (
              <p className="text-xs text-amber-400/80 pt-1 border-t border-amber-500/20">
                {t.revealedMsg}
              </p>
            )}
            {checked && hasWrong && !revealed && (
              <p className="text-xs text-rose-400/80 pt-1 border-t border-rose-500/20">
                {t.wrongMsgPre}{" "}
                <span className="font-medium text-rose-300">{t.hintBtn}</span>{" "}
                {t.wrongMsgPost}
              </p>
            )}
          </div>

          {/* Text input */}
          <div className="relative">
            <textarea
              ref={inputRef}
              value={raw}
              onChange={handleInput}
              onKeyDown={onKeyDown}
              placeholder={t.inputPlaceholder}
              rows={2}
              disabled={revealed}
              className={cn(
                "w-full resize-none rounded-xl border bg-card px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/40",
                "focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/50",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-colors",
                allCorrect &&
                  "border-emerald-500/50 ring-2 ring-emerald-500/20",
                revealed && "border-amber-500/40",
                !allCorrect && !revealed && "border-border",
              )}
            />
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={replay}
            >
              <RefreshCw className="size-3.5" /> {t.replayBtn}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={revealNext}
              disabled={revealed || allCorrect}
            >
              <Lightbulb className="size-3.5" /> {t.hintBtn}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={revealAll}
              disabled={revealed}
            >
              <Eye className="size-3.5" /> {t.showAnswerBtn}
            </Button>

            <div className="ml-auto flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={goPrev}
                disabled={current === 0}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                size="sm"
                className={cn(
                  "gap-1.5 transition-all",
                  allCorrect &&
                    "ring-2 ring-emerald-500/40 bg-emerald-600 hover:bg-emerald-700",
                )}
                onClick={
                  allCorrect || revealed ? goNext : () => setChecked(true)
                }
              >
                {allCorrect || revealed ? (
                  <>
                    {t.nextBtn} <ChevronRight className="size-4" />
                  </>
                ) : (
                  <>
                    {t.checkBtn} <ChevronRight className="size-4" />
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Hint: first-letter guide */}
          {checked && hasWrong && !revealed && (
            <div className="rounded-lg bg-white/3 border border-border px-4 py-2.5 text-xs text-muted-foreground">
              <span className="font-medium text-foreground mr-2">
                {t.firstLetters}
              </span>
              {expectedWords.map((w, i) => (
                <span
                  key={`${i}-${w}`}
                  className={cn(
                    "font-mono mr-2",
                    wordStates[i]?.status === "correct"
                      ? "text-emerald-400"
                      : wordStates[i]?.status === "wrong"
                        ? "text-rose-400"
                        : "text-foreground",
                  )}
                >
                  {w[0]}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Transcript sidebar ── */}
      <aside className="w-72 shrink-0 border-l border-border flex flex-col overflow-hidden bg-card">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <span className="text-sm font-semibold">{t.transcript}</span>
          <button
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setHideTranscript((v) => !v)}
          >
            {hideTranscript ? t.show : t.hide}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          {sentences.map((s, i) => {
            const isCurrent = i === current;
            const isPast = i < done;
            return (
              <button
                key={s.id}
                ref={isCurrent ? transcriptItemRef : null}
                onClick={() => {
                  setCurrent(i);
                  seekTo(s.startMs);
                }}
                className={cn(
                  "w-full text-left px-4 py-3 flex gap-3 transition-colors border-l-2",
                  isCurrent
                    ? "border-primary bg-primary/10"
                    : "border-transparent hover:bg-white/5",
                )}
              >
                <div
                  className={cn(
                    "size-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5",
                    isCurrent
                      ? "border-primary"
                      : isPast
                        ? "border-emerald-500 bg-emerald-500"
                        : "border-border",
                  )}
                >
                  {isPast && <CheckCircle2 className="size-3 text-white" />}
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[10px] text-muted-foreground">
                    #{i + 1}
                  </span>
                  <p
                    className={cn(
                      "text-xs leading-relaxed",
                      hideTranscript && !isPast
                        ? "blur-sm select-none"
                        : "text-foreground",
                    )}
                  >
                    {s.text}
                  </p>
                </div>
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

// Re-export TranscriptSidebar so it stays used (avoids dead-import lint)
export { TranscriptSidebar };
