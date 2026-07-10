"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, ChevronDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { transcriptApi } from "@/lib/api-client";
import type { Sentence } from "@prisma/client";

// ─── Language catalogue ────────────────────────────────────────────────────
export const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "vi", label: "Tiếng Việt" },
  { code: "zh-Hans", label: "中文 (简体)" },
  { code: "zh-Hant", label: "中文 (繁體)" },
  { code: "ja", label: "日本語" },
  { code: "ko", label: "한국어" },
  { code: "fr", label: "Français" },
  { code: "de", label: "Deutsch" },
  { code: "es", label: "Español" },
  { code: "pt", label: "Português" },
  { code: "ru", label: "Русский" },
  { code: "ar", label: "العربية" },
  { code: "id", label: "Bahasa Indonesia" },
  { code: "th", label: "ภาษาไทย" },
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface TranscriptLine {
  text: string;
  offset: number;
  duration: number;
}

interface Props {
  youtubeId: string;
  sentences: Sentence[];       // primary (stored) sentences for the game
  current: number;             // active sentence index
  done: Set<number>;
  progress: number;
  hideByDefault?: boolean;
  onGoTo: (i: number) => void;
}

// ─── Align raw transcript lines → sentence buckets ─────────────────────────
function alignToSentences(
  lines: TranscriptLine[],
  sentences: Sentence[],
): string[] {
  return sentences.map((s) => {
    const mid = s.startMs + (s.endMs - s.startMs) / 2;
    // collect all lines whose playback range overlaps the sentence window
    const overlapping = lines.filter((l) => {
      const lEnd = l.offset + l.duration;
      return lEnd > s.startMs && l.offset < s.endMs;
    });
    if (overlapping.length > 0) return overlapping.map((l) => l.text).join(" ");
    // fallback: find nearest line to midpoint
    let best = lines[0];
    let bestDist = Infinity;
    for (const l of lines) {
      const d = Math.abs(l.offset + l.duration / 2 - mid);
      if (d < bestDist) { bestDist = d; best = l; }
    }
    return best?.text ?? "";
  });
}

// ─── Component ────────────────────────────────────────────────────────────────
export function TranscriptSidebar({
  youtubeId,
  sentences,
  current,
  done,
  progress,
  hideByDefault = false,
  onGoTo,
}: Readonly<Props>) {
  const [hide, setHide] = useState(hideByDefault);
  const [lang, setLang] = useState("en");
  const [langOpen, setLangOpen] = useState(false);
  const [altLines, setAltLines] = useState<string[] | null>(null); // null = same as primary
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll active item
  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [current]);

  // Fetch alternate language transcript when lang changes
  useEffect(() => {
    if (lang === "en") { setAltLines(null); setError(null); return; }
    setLoading(true);
    setError(null);
    transcriptApi.fetch(youtubeId, lang)
      .then((lines) => {
        setAltLines(alignToSentences(lines, sentences));
        setError(null);
      })
      .catch((e: Error) => {
        setError(`Không có phụ đề "${LANGUAGES.find((l) => l.code === lang)?.label ?? lang}"`);
        setAltLines(null);
      })
      .finally(() => setLoading(false));
  }, [lang, youtubeId, sentences]);

  const activeLang = LANGUAGES.find((l) => l.code === lang);

  return (
    <aside className="w-72 shrink-0 border-l border-border flex flex-col overflow-hidden bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0 gap-2">
        <span className="text-sm font-semibold shrink-0">Transcript</span>

        {/* Language picker */}
        <div className="relative">
          <button
            onClick={() => setLangOpen((v) => !v)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2 py-1 rounded-md hover:bg-white/5"
          >
            {loading
              ? <Loader2 className="size-3 animate-spin" />
              : <span className="font-medium text-primary">{activeLang?.label ?? lang}</span>
            }
            <ChevronDown className={cn("size-3 transition-transform", langOpen && "rotate-180")} />
          </button>

          {langOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setLangOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-20 w-44 rounded-xl border border-border bg-card shadow-2xl shadow-black/40 overflow-hidden">
                <div className="py-1 max-h-72 overflow-y-auto scrollbar-thin">
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      onClick={() => { setLang(l.code); setLangOpen(false); }}
                      className={cn(
                        "w-full text-left px-3 py-2 text-xs transition-colors",
                        lang === l.code
                          ? "bg-primary/15 text-primary font-medium"
                          : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                      )}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <button
          className="text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
          onClick={() => setHide((v) => !v)}
        >
          {hide ? "Hiện" : "Ẩn"}
        </button>
      </div>

      {/* Error banner */}
      {error && (
        <div className="px-4 py-2 text-xs text-amber-400 bg-amber-500/10 border-b border-amber-500/20 shrink-0">
          {error} — chọn ngôn ngữ khác
        </div>
      )}

      {/* Sentence list */}
      <div className="flex-1 overflow-y-auto py-2 scrollbar-thin">
        {sentences.map((s, i) => {
          const isCurrent = i === current;
          const isDone = done.has(i);
          const altText = altLines?.[i];
          return (
            <button
              key={s.id}
              ref={isCurrent ? activeRef : null}
              onClick={() => onGoTo(i)}
              className={cn(
                "w-full text-left px-4 py-3 flex gap-3 transition-colors border-l-2",
                isCurrent ? "border-primary bg-primary/10" : "border-transparent hover:bg-white/5",
              )}
            >
              {/* Status circle */}
              <div className={cn(
                "size-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5",
                isCurrent ? "border-primary" :
                isDone ? "border-emerald-500 bg-emerald-500" : "border-border",
              )}>
                {isDone && <CheckCircle2 className="size-3 text-white" />}
              </div>

              {/* Text */}
              <div className="flex flex-col gap-1 min-w-0">
                <span className="text-[10px] text-muted-foreground">#{i + 1}</span>
                {/* Primary (English) */}
                <p className={cn(
                  "text-xs leading-relaxed",
                  hide && !isDone && !isCurrent ? "blur-sm select-none" : "text-foreground",
                )}>
                  {s.text}
                </p>
                {/* Alternate language */}
                {altText && (
                  <p className={cn(
                    "text-xs leading-relaxed text-primary/80 italic",
                    hide && !isDone && !isCurrent ? "blur-sm select-none" : "",
                  )}>
                    {altText}
                  </p>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Footer progress */}
      <div className="px-4 py-3 border-t border-border shrink-0">
        <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
          <span>Tiến độ</span><span>{progress}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </aside>
  );
}
