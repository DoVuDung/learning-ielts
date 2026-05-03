"use client";

import { useEffect, useState } from "react";
import { Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/locale-context";

interface WordRevealChipsProps {
  /** The sentence text to split into chips */
  text: string;
  /** Force all words visible (e.g. after "reveal all" is pressed externally) */
  forceReveal?: boolean;
  /** Called whenever a word is revealed — useful for tracking progress */
  onReveal?: (index: number) => void;
  /** Called when all words have been revealed */
  onAllRevealed?: () => void;
  /** Show the sentence index header row */
  showHeader?: boolean;
  sentenceIndex?: number;
  sentenceTotal?: number;
}

function splitWords(text: string) {
  return text.split(/(\s+)/).filter((t) => t.trim().length > 0);
}

function Chip({
  word,
  revealed,
  forceReveal,
  onClick,
  hint,
}: Readonly<{
  word: string;
  revealed: boolean;
  forceReveal: boolean;
  onClick: () => void;
  hint: string;
}>) {
  const bare = word.replaceAll(/[^a-zA-Z0-9']/g, "");
  const minW = Math.max(bare.length * 9, 28);
  const show = revealed || forceReveal;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={show}
      className={cn(
        "inline-flex items-center justify-center rounded-lg px-2 py-1.5 text-sm font-medium border transition-all select-none",
        show
          ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-300 cursor-default"
          : "bg-white/5 border-border text-transparent hover:bg-primary/10 hover:border-primary/50 cursor-pointer active:scale-95",
      )}
      style={{ minWidth: `${minW}px` }}
      title={show ? word : hint}
    >
      {show ? word : "•".repeat(Math.max(bare.length, 1))}
    </button>
  );
}

export function WordRevealChips({
  text,
  forceReveal = false,
  onReveal,
  onAllRevealed,
  showHeader = true,
  sentenceIndex,
  sentenceTotal,
}: Readonly<WordRevealChipsProps>) {
  const { t } = useLocale();
  const words = splitWords(text);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  // Reset when sentence changes
  useEffect(() => {
    setRevealed(new Set());
  }, [text]);

  // Notify parent when all revealed naturally
  useEffect(() => {
    if (!forceReveal && revealed.size === words.length && words.length > 0) {
      onAllRevealed?.();
    }
  }, [revealed, words.length, forceReveal, onAllRevealed]);

  function revealWord(i: number) {
    if (revealed.has(i) || forceReveal) return;
    setRevealed((prev) => {
      const next = new Set(prev);
      next.add(i);
      return next;
    });
    onReveal?.(i);
  }

  function revealAll() {
    setRevealed(new Set(words.map((_, i) => i)));
    onAllRevealed?.();
  }

  const allRevealed = forceReveal || revealed.size === words.length;

  return (
    <div className="flex flex-col gap-3">
      {showHeader && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {sentenceIndex !== undefined && sentenceTotal !== undefined && (
              <>{t.sentencePrefix} #{sentenceIndex + 1}/{sentenceTotal}</>
            )}
            {revealed.size > 0 && !allRevealed && (
              <span className="ml-2 text-primary">
                {revealed.size}/{words.length} {t.wordsUnit}
              </span>
            )}
            {allRevealed && (
              <span className="ml-2 text-emerald-400 font-medium">{t.completed}</span>
            )}
          </span>
          {!allRevealed && (
            <button
              type="button"
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              onClick={revealAll}
            >
              <Eye className="size-3.5" />
              {t.seeAll}
            </button>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {words.map((word, i) => (
          <Chip
            key={`${i}-${word}`}
            word={word}
            revealed={revealed.has(i)}
            forceReveal={forceReveal}
            onClick={() => revealWord(i)}
            hint={t.chipHint}
          />
        ))}
      </div>

      {allRevealed && (
        <p className="text-xs text-muted-foreground border-t border-border pt-3">
          {t.repeatPrompt}{" "}
          <span className="text-primary font-medium">{t.doneNext}</span>
        </p>
      )}
    </div>
  );
}
