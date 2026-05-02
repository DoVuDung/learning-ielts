"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, BookOpen, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import type { SavedWord } from "@prisma/client";

interface Props {
  initialWords: SavedWord[];
}

export function WordListClient({ initialWords }: Props) {
  const router = useRouter();
  const [words, setWords] = useState(initialWords);
  const [query, setQuery] = useState("");

  const filtered = words.filter((w) =>
    w.word.toLowerCase().includes(query.toLowerCase())
  );

  async function remove(word: string) {
    await fetch("/api/words", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word }),
    });
    setWords((prev) => prev.filter((w) => w.word !== word));
    router.refresh();
  }

  if (words.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
        <BookOpen className="size-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Chưa có từ nào được lưu.</p>
        <p className="text-xs text-muted-foreground">
          Trong khi luyện dictation, nhấn <span className="text-primary font-medium">Lưu từ</span> để thêm từ vào đây.
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
        {filtered.map((w) => (
          <div
            key={w.id}
            className="flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3"
          >
            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
              <p className="text-sm font-semibold text-foreground">{w.word}</p>
              {w.context && (
                <p className="text-xs text-muted-foreground italic line-clamp-2">
                  &ldquo;{w.context}&rdquo;
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 text-muted-foreground hover:text-rose-400"
              onClick={() => remove(w.word)}
            >
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ))}
      </div>

      {filtered.length === 0 && query && (
        <p className="text-sm text-muted-foreground text-center py-8">
          Không tìm thấy từ &ldquo;{query}&rdquo;
        </p>
      )}
    </main>
  );
}
