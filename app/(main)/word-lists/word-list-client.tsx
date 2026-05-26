"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, BookOpen, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Card, Note } from "@prisma/client";

type NoteWithCards = Note & { cards: Card[] };

interface Props {
  initialNotes: NoteWithCards[];
}

const STATE_LABEL: Record<Card["state"], { label: string; className: string }> = {
  NEW: { label: "Mới", className: "bg-sky-500/15 text-sky-300" },
  LEARNING: { label: "Đang học", className: "bg-rose-500/15 text-rose-300" },
  REVIEW: { label: "Ôn tập", className: "bg-emerald-500/15 text-emerald-300" },
  RELEARNING: { label: "Học lại", className: "bg-amber-500/15 text-amber-300" },
};

export function WordListClient({ initialNotes }: Props) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes);
  const [query, setQuery] = useState("");

  const filtered = notes.filter((n) =>
    n.word.toLowerCase().includes(query.toLowerCase()),
  );

  async function remove(word: string) {
    await fetch("/api/words", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word }),
    });
    setNotes((prev) => prev.filter((n) => n.word !== word));
    router.refresh();
  }

  if (notes.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
        <BookOpen className="size-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Chưa có từ nào được lưu.</p>
        <p className="text-xs text-muted-foreground">
          Trong khi luyện dictation, nhấn{" "}
          <span className="text-primary font-medium">Lưu từ</span> để thêm vào đây.
        </p>
      </div>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm từ..."
          className="pl-9"
        />
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((n) => {
          const card = n.cards[0];
          const meta = card ? STATE_LABEL[card.state] : null;
          return (
            <div
              key={n.id}
              className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3"
            >
              <div className="flex-1 min-w-0 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {n.word}
                  </p>
                  {meta && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider shrink-0",
                        meta.className,
                      )}
                    >
                      {meta.label}
                    </span>
                  )}
                </div>
                {n.context && (
                  <p className="text-xs text-muted-foreground italic line-clamp-2">
                    &ldquo;{n.context}&rdquo;
                  </p>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0 text-muted-foreground hover:text-rose-400"
                onClick={() => remove(n.word)}
              >
                <Trash2 className="size-3.5" />
              </Button>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && query && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Không tìm thấy từ &ldquo;{query}&rdquo;
        </p>
      )}
    </main>
  );
}
