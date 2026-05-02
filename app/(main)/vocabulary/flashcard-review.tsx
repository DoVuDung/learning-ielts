"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, XCircle, Eye, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { SavedWord } from "@prisma/client";

interface Props {
  words: SavedWord[];
}

// SM-2 spaced repetition: quality 0-5
function sm2(word: SavedWord, quality: number) {
  const ef = Math.max(1.3, word.easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  const interval = quality < 3 ? 1 : Math.round(word.interval <= 1 ? 1 : word.interval <= 6 ? 6 : word.interval * ef);
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + interval);
  return { interval, easeFactor: ef, nextReview };
}

export function FlashcardReview({ words }: Props) {
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(0);
  const [finished, setFinished] = useState(false);

  const word = words[index];
  const progress = Math.round((done / words.length) * 100);

  async function respond(quality: number) {
    const update = sm2(word, quality);
    await fetch("/api/words/review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ wordId: word.id, ...update }),
    });

    const next = index + 1;
    setDone((d) => d + 1);
    if (next >= words.length) {
      setFinished(true);
    } else {
      setIndex(next);
      setFlipped(false);
    }
  }

  if (finished) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center px-6">
        <Trophy className="size-14 text-amber-400" />
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-bold">Hoàn thành!</h2>
          <p className="text-sm text-muted-foreground">Bạn đã ôn {words.length} từ hôm nay.</p>
        </div>
        <Button onClick={() => router.refresh()}>Tiếp tục</Button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto flex flex-col items-center justify-center gap-8 px-6 py-8">
      {/* Progress */}
      <div className="w-full max-w-lg flex flex-col gap-2">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{done}/{words.length} từ</span>
          <span>{progress}%</span>
        </div>
        <Progress value={progress} className="h-1.5" />
      </div>

      {/* Card */}
      <div
        className={cn(
          "w-full max-w-lg rounded-2xl border-2 bg-card p-8 flex flex-col items-center gap-6 cursor-pointer transition-all min-h-48 justify-center",
          flipped ? "border-primary/40" : "border-border hover:border-primary/30"
        )}
        onClick={() => !flipped && setFlipped(true)}
      >
        <p className="text-2xl font-bold text-foreground text-center">{word.word}</p>

        {!flipped ? (
          <div className="flex flex-col items-center gap-2">
            <button className="flex items-center gap-1.5 text-sm text-primary font-medium">
              <Eye className="size-4" />
              Nhấn để xem ngữ cảnh
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 w-full">
            {word.context && (
              <p className="text-sm text-muted-foreground italic text-center leading-relaxed border-t border-border pt-4 w-full">
                &ldquo;{word.context}&rdquo;
              </p>
            )}
          </div>
        )}
      </div>

      {/* Rating buttons */}
      {flipped && (
        <div className="flex gap-3 w-full max-w-lg">
          <Button
            variant="outline"
            className="flex-1 gap-2 border-rose-500/40 text-rose-400 hover:bg-rose-500/10"
            onClick={() => respond(1)}
          >
            <XCircle className="size-4" />
            Chưa nhớ
          </Button>
          <Button
            variant="outline"
            className="flex-1 gap-2 border-amber-500/40 text-amber-400 hover:bg-amber-500/10"
            onClick={() => respond(3)}
          >
            Khó nhớ
          </Button>
          <Button
            className="flex-1 gap-2"
            onClick={() => respond(5)}
          >
            <CheckCircle2 className="size-4" />
            Nhớ rõ
          </Button>
        </div>
      )}

      {!flipped && (
        <p className="text-xs text-muted-foreground">Nhấn vào thẻ để lật</p>
      )}
    </div>
  );
}
