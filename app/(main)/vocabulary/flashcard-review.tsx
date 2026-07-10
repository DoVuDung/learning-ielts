"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { wordsApi } from "@/lib/api-client";
import {
  previewIntervals,
  type Rating,
  type State as FsrsState,
} from "@/lib/fsrs";
import type { Card, Note } from "@prisma/client";

type CardWithNote = Card & { note: Note };

interface Props {
  cards: CardWithNote[];
}

const STATE_COPY: Record<FsrsState, { label: string; className: string }> = {
  NEW: { label: "Mới", className: "bg-sky-500/15 text-sky-300 border-sky-500/30" },
  LEARNING: {
    label: "Đang học",
    className: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  },
  REVIEW: {
    label: "Ôn tập",
    className: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  },
  RELEARNING: {
    label: "Học lại",
    className: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  },
};

const RATING_BUTTONS: {
  rating: Rating;
  label: string;
  hint: string;
  className: string;
  hotkey: string;
}[] = [
  {
    rating: 1,
    label: "Quên",
    hint: "Again",
    hotkey: "1",
    className: "border-rose-500/40 text-rose-300 hover:bg-rose-500/15",
  },
  {
    rating: 2,
    label: "Khó",
    hint: "Hard",
    hotkey: "2",
    className: "border-amber-500/40 text-amber-300 hover:bg-amber-500/15",
  },
  {
    rating: 3,
    label: "Tốt",
    hint: "Good",
    hotkey: "3",
    className: "border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/15",
  },
  {
    rating: 4,
    label: "Dễ",
    hint: "Easy",
    hotkey: "4",
    className: "border-sky-500/40 text-sky-300 hover:bg-sky-500/15",
  },
];

export function FlashcardReview({ cards }: Props) {
  const router = useRouter();
  const [queue, setQueue] = useState(cards);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(0);
  const [busy, setBusy] = useState(false);

  const card = queue[0];
  const total = cards.length;
  const progress = total === 0 ? 0 : Math.round((done / total) * 100);

  const intervals = useMemo(() => {
    if (!card) return [];
    return previewIntervals({
      state: card.state,
      due: card.due,
      stability: card.stability,
      difficulty: card.difficulty,
      elapsedDays: card.elapsedDays,
      scheduledDays: card.scheduledDays,
      reps: card.reps,
      lapses: card.lapses,
      lastReview: card.lastReview,
    });
  }, [card]);

  async function respond(rating: Rating) {
    if (!card || busy) return;
    setBusy(true);
    try {
      await wordsApi.review(card.id, rating);

      setQueue((prev) => {
        const [head, ...rest] = prev;
        // Again or Hard with same-day step → re-show this card later in the session.
        if (rating === 1 || (rating === 2 && head.state === "NEW")) {
          return [...rest, head];
        }
        return rest;
      });
      setDone((d) => d + 1);
      setFlipped(false);
    } finally {
      setBusy(false);
    }
  }

  if (!card) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center px-6">
        <Trophy className="size-14 text-amber-400" />
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold">Hoàn thành!</h2>
          <p className="text-sm text-muted-foreground">
            Đã ôn {done} thẻ trong phiên này.
          </p>
        </div>
        <Button onClick={() => router.refresh()}>Tiếp tục</Button>
      </div>
    );
  }

  const stateMeta = STATE_COPY[card.state];

  return (
    <div
      className="flex-1 overflow-y-auto flex flex-col items-center justify-center gap-8 px-6 py-8"
      onKeyDown={(e) => {
        if (!flipped && e.key === " ") {
          e.preventDefault();
          setFlipped(true);
          return;
        }
        if (flipped && ["1", "2", "3", "4"].includes(e.key)) {
          e.preventDefault();
          respond(Number(e.key) as Rating);
        }
      }}
      tabIndex={0}
    >
      {/* Progress + queue stats */}
      <div className="w-full max-w-lg flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{done}/{total} thẻ</span>
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider",
              stateMeta.className,
            )}
          >
            {stateMeta.label}
          </span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Card */}
      <div
        className={cn(
          "w-full max-w-lg rounded-2xl border-2 bg-card p-8 flex flex-col items-center gap-6 cursor-pointer transition-all min-h-56 justify-center",
          flipped ? "border-primary/40" : "border-border hover:border-primary/30",
        )}
        onClick={() => !flipped && setFlipped(true)}
      >
        <p className="text-2xl font-bold text-foreground text-center">
          {card.note.word}
        </p>

        {!flipped ? (
          <button className="flex items-center gap-1.5 text-sm text-primary font-medium">
            <Eye className="size-4" />
            Nhấn để xem ngữ cảnh (Space)
          </button>
        ) : (
          <div className="flex flex-col items-center gap-3 w-full">
            {card.note.definition && (
              <p className="text-sm text-foreground/90 text-center leading-relaxed">
                {card.note.definition}
              </p>
            )}
            {card.note.context && (
              <p className="text-sm text-muted-foreground italic text-center leading-relaxed border-t border-border pt-4 w-full">
                &ldquo;{card.note.context}&rdquo;
              </p>
            )}
            {!card.note.definition && !card.note.context && (
              <p className="text-xs text-muted-foreground">
                Chưa có ngữ cảnh hay nghĩa cho từ này.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Rating buttons */}
      {flipped ? (
        <div className="grid w-full max-w-lg grid-cols-4 gap-2">
          {RATING_BUTTONS.map((b) => {
            const preview = intervals.find((i) => i.rating === b.rating);
            return (
              <Button
                key={b.rating}
                variant="outline"
                disabled={busy}
                onClick={() => respond(b.rating)}
                className={cn(
                  "flex h-auto flex-col gap-0.5 py-3",
                  b.className,
                )}
              >
                <span className="text-sm font-semibold">{b.label}</span>
                <span className="text-[10px] uppercase tracking-wider opacity-70">
                  {preview?.humanInterval ?? b.hint}
                </span>
              </Button>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          Nhấn vào thẻ hoặc phím Space để lật
        </p>
      )}
    </div>
  );
}
