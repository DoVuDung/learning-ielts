"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft, ChevronRight, RefreshCw,
  Eye, EyeOff, CheckCircle2, XCircle, BookmarkPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import type { Video, Sentence } from "@prisma/client";

interface Props {
  video: Video;
  sentences: Sentence[];
  initialDone: number;
}

type SentenceState = "idle" | "correct" | "wrong" | "revealed";

function normalise(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9\s']/g, "").replace(/\s+/g, " ").trim();
}

function WordHints({ text }: { text: string }) {
  const words = text.split(" ");
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {words.map((word, i) => (
        <span
          key={i}
          className="inline-flex items-center justify-center rounded px-2 py-1 text-xs font-mono bg-white/5 border border-border text-transparent select-none"
          style={{ minWidth: `${Math.max(word.length * 7, 24)}px` }}
        >
          {"•".repeat(word.length)}
        </span>
      ))}
    </div>
  );
}

export function DictationPlayer({ video, sentences, initialDone }: Props) {
  const router = useRouter();
  const [current, setCurrent] = useState(initialDone < sentences.length ? initialDone : 0);
  const [input, setInput] = useState("");
  const [state, setState] = useState<SentenceState>("idle");
  const [autoNext, setAutoNext] = useState(false);
  const [hideTranslation, setHideTranslation] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [hint1st, setHint1st] = useState(false);
  const [done, setDone] = useState(initialDone);
  // word saving
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());
  const [showWordInput, setShowWordInput] = useState(false);
  const [wordInput, setWordInput] = useState("");
  const [saveMsg, setSaveMsg] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const wordInputRef = useRef<HTMLInputElement>(null);
  const playerRef = useRef<HTMLIFrameElement>(null);
  const autoNextTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const sentence = sentences[current];
  const progress = Math.round((done / sentences.length) * 100);
  const firstLetterHints = hint1st
    ? sentence.text.split(" ").map((w) => w[0]).join(" ")
    : null;

  const saveProgress = useCallback(
    async (sentencesDone: number) => {
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ videoId: video.id, sentencesDone, totalSentences: sentences.length }),
      });
    },
    [video.id, sentences.length]
  );

  const seekTo = useCallback((ms: number) => {
    playerRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func: "seekTo", args: [Math.floor(ms / 1000), true] }),
      "*"
    );
  }, []);

  function replay() {
    seekTo(sentence.startMs);
    setState("idle");
    setInput("");
    setHint1st(false);
    setShowAll(false);
    inputRef.current?.focus();
  }

  function check() {
    if (!input.trim()) return;
    const correct = normalise(input) === normalise(sentence.text);
    setState(correct ? "correct" : "wrong");
    if (correct && current + 1 > done) {
      const newDone = current + 1;
      setDone(newDone);
      saveProgress(newDone);
    }
    if (correct && autoNext) {
      autoNextTimer.current = setTimeout(() => goNext(), 1200);
    }
  }

  function goNext() {
    if (autoNextTimer.current) clearTimeout(autoNextTimer.current);
    if (current < sentences.length - 1) {
      setCurrent((c) => c + 1);
      setInput("");
      setState("idle");
      setHint1st(false);
      setShowAll(false);
      setShowWordInput(false);
      setWordInput("");
      setSaveMsg("");
    }
  }

  function goPrev() {
    if (autoNextTimer.current) clearTimeout(autoNextTimer.current);
    if (current > 0) {
      setCurrent((c) => c - 1);
      setInput("");
      setState("idle");
      setHint1st(false);
      setShowAll(false);
      setShowWordInput(false);
      setWordInput("");
      setSaveMsg("");
    }
  }

  async function saveWord() {
    const word = wordInput.trim().toLowerCase();
    if (!word) return;
    await fetch("/api/words", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word, context: sentence.text, videoId: video.id }),
    });
    setSavedWords((prev) => new Set([...prev, word]));
    setSaveMsg(`Đã lưu "${word}"`);
    setWordInput("");
    setTimeout(() => setSaveMsg(""), 2500);
  }

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target !== inputRef.current) return;
      if (e.key === "Enter") {
        e.preventDefault();
        if (state === "idle" || state === "wrong") check();
        else goNext();
      }
      if (e.key === "Tab") {
        e.preventDefault();
        replay();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => { inputRef.current?.focus(); }, [current]);
  useEffect(() => { if (showWordInput) wordInputRef.current?.focus(); }, [showWordInput]);

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Left: video + input ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center gap-3 px-4 py-3 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10 shrink-0">
          <Button variant="ghost" size="icon" className="size-8" onClick={() => router.back()}>
            <ChevronLeft className="size-4" />
          </Button>
          <p className="text-sm font-semibold flex-1 truncate">{video.title}</p>
          <span className="text-xs text-muted-foreground shrink-0">{done}/{sentences.length}</span>
          <div className="w-32 shrink-0">
            <Progress value={progress} className="h-1.5" />
          </div>
          <span className="text-xs text-primary font-medium shrink-0">{progress}%</span>
        </header>

        {/* YouTube player */}
        <div className="relative w-full aspect-video bg-black shrink-0">
          <iframe
            ref={playerRef}
            src={`https://www.youtube.com/embed/${video.youtubeId}?enablejsapi=1&rel=0&modestbranding=1`}
            className="absolute inset-0 size-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        {/* Controls bar */}
        <div className="flex items-center gap-4 px-4 py-2 border-b border-border bg-card shrink-0 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">#{current + 1}</span>
          <span>{input.trim().split(/\s+/).filter(Boolean).length}/{sentence.text.split(" ").length} từ</span>
          <kbd className="ml-1 px-1.5 py-0.5 rounded bg-white/5 border border-border font-mono text-[10px]">Enter</kbd>
          <span>kiểm tra</span>
          <kbd className="px-1.5 py-0.5 rounded bg-white/5 border border-border font-mono text-[10px]">Tab</kbd>
          <span>phát lại</span>
          <div className="ml-auto flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <Switch checked={autoNext} onCheckedChange={setAutoNext} className="scale-75" />
              <span>Tự động tiếp</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <Switch checked={hideTranslation} onCheckedChange={setHideTranslation} className="scale-75" />
              <span>Ẩn dịch</span>
            </label>
          </div>
        </div>

        {/* Input area */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
          {/* Answer box */}
          <div className={cn(
            "rounded-xl border-2 p-4 transition-colors",
            state === "correct" && "border-emerald-500/60 bg-emerald-500/5",
            state === "wrong" && "border-rose-500/60 bg-rose-500/5",
            state === "revealed" && "border-amber-500/60 bg-amber-500/5",
            state === "idle" && "border-primary/40 bg-card"
          )}>
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => { setInput(e.target.value); setState("idle"); }}
              placeholder="Gõ câu bạn nghe được..."
              className="border-0 bg-transparent text-base shadow-none focus-visible:ring-0 px-0 placeholder:text-muted-foreground/50"
              disabled={state === "correct" || state === "revealed"}
            />
            {state === "correct" && (
              <div className="flex items-center gap-2 mt-2 text-emerald-400 text-sm font-medium">
                <CheckCircle2 className="size-4" /> Chính xác!
              </div>
            )}
            {state === "wrong" && (
              <div className="flex items-center gap-2 mt-2 text-rose-400 text-sm font-medium">
                <XCircle className="size-4" /> Chưa đúng — thử lại hoặc xem gợi ý
              </div>
            )}
            {state === "revealed" && (
              <p className="mt-2 text-sm text-amber-400 font-medium">{sentence.text}</p>
            )}
            {!showAll && <WordHints text={sentence.text} />}
            {showAll && state !== "revealed" && (
              <p className="mt-3 text-sm text-amber-400 font-medium">{sentence.text}</p>
            )}
          </div>

          {/* 1st-letter hint */}
          {hint1st && (
            <p className="text-xs text-muted-foreground px-1">
              Chữ đầu: <span className="font-mono text-foreground">{firstLetterHints}</span>
            </p>
          )}

          {/* Save-word panel */}
          {showWordInput && (
            <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2">
              <BookmarkPlus className="size-4 text-primary shrink-0" />
              <Input
                ref={wordInputRef}
                value={wordInput}
                onChange={(e) => setWordInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && saveWord()}
                placeholder="Nhập từ cần lưu..."
                className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 h-7 text-sm"
              />
              <Button size="sm" variant="ghost" className="h-7 px-2 text-primary" onClick={saveWord}>
                Lưu
              </Button>
              <Button size="sm" variant="ghost" className="h-7 px-2 text-muted-foreground" onClick={() => setShowWordInput(false)}>
                Hủy
              </Button>
            </div>
          )}
          {saveMsg && <p className="text-xs text-emerald-400 px-1">{saveMsg}</p>}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={replay}>
              <RefreshCw className="size-3.5" /> Phát lại
            </Button>
            <Button variant="outline" size="sm" onClick={() => setHint1st(true)} disabled={hint1st}>
              1st letter
            </Button>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => { setShowAll(true); setState("revealed"); }}>
              <Eye className="size-3.5" /> Xem đáp án
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={cn("gap-2", savedWords.size > 0 && "text-primary border-primary/40")}
              onClick={() => setShowWordInput((v) => !v)}
            >
              <BookmarkPlus className="size-3.5" /> Lưu từ
            </Button>
            <div className="ml-auto flex gap-2">
              <Button variant="ghost" size="sm" onClick={goPrev} disabled={current === 0}>
                <ChevronLeft className="size-4" />
              </Button>
              <Button size="sm" className="gap-1" onClick={() => {
                if (state === "idle" || state === "wrong") check();
                else goNext();
              }}>
                {state === "idle" || state === "wrong" ? "Kiểm tra" : "Tiếp theo"}
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: transcript panel ── */}
      <aside className="w-80 shrink-0 border-l border-border flex flex-col overflow-hidden bg-card">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <span className="text-sm font-semibold">Transcript</span>
          <button
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => setHideTranslation((v) => !v)}
          >
            {hideTranslation ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            {hideTranslation ? "Hiện" : "Ẩn"}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          {sentences.map((s, i) => {
            const isCurrent = i === current;
            const isPast = i < done;
            return (
              <button
                key={s.id}
                onClick={() => {
                  setCurrent(i);
                  setInput("");
                  setState("idle");
                  setHint1st(false);
                  setShowAll(false);
                  seekTo(s.startMs);
                }}
                className={cn(
                  "w-full text-left px-4 py-3 flex gap-3 transition-colors border-l-2",
                  isCurrent ? "border-primary bg-primary/10" : "border-transparent hover:bg-white/5"
                )}
              >
                <div className={cn(
                  "size-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5",
                  isCurrent ? "border-primary" : isPast ? "border-emerald-500 bg-emerald-500" : "border-border"
                )}>
                  {isPast && <CheckCircle2 className="size-3 text-white" />}
                </div>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[10px] text-muted-foreground">#{i + 1}</span>
                  <p className={cn(
                    "text-xs leading-relaxed",
                    hideTranslation && !isPast && !isCurrent ? "blur-sm select-none" : "text-foreground"
                  )}>
                    {s.text}
                  </p>
                </div>
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
