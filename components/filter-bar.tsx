"use client";

import { useState } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Flame } from "lucide-react";

const categories = [
  { id: "all", label: "Tất cả" },
  { id: "bbc", label: "BBC Learning English", count: 41 },
  { id: "business", label: "Business", count: 41 },
  { id: "health", label: "Health & Medicine", count: 18 },
  { id: "job", label: "Job Interview", count: 30 },
  { id: "kurzgesagt", label: "Kurzgesagt – In a Nutshell", count: 12 },
  { id: "music", label: "Music", count: 43 },
  { id: "ted", label: "TED", count: 76 },
  { id: "tech", label: "Technology & Science", count: 29 },
  { id: "travel", label: "Travel & Culture", count: 23 },
  { id: "daily", label: "Daily Conversations", count: 49 },
  { id: "ielts", label: "IELTS", count: 256, hot: true },
  { id: "toeic", label: "TOEIC", count: 200, hot: true },
];

const levels = [
  { id: "all-levels", label: "Tất cả cấp độ" },
  { id: "a1", label: "A1" },
  { id: "a2", label: "A2" },
  { id: "b1", label: "B1" },
  { id: "b2", label: "B2" },
  { id: "c1", label: "C1" },
];

function FilterChip({
  label,
  count,
  hot,
  active,
  onClick,
}: Readonly<{
  label: string;
  count?: number;
  hot?: boolean;
  active: boolean;
  onClick: () => void;
}>) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-all",
        active
          ? "bg-primary text-white shadow-sm shadow-primary/30"
          : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground"
      )}
    >
      {label}
      {count !== undefined && (
        <span
          className={cn(
            "text-xs",
            active ? "text-white/80" : "text-muted-foreground"
          )}
        >
          ({count})
        </span>
      )}
      {hot && <Flame className="size-3 text-orange-400" />}
    </button>
  );
}

export function FilterBar() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [activeLevel, setActiveLevel] = useState("all-levels");

  return (
    <div className="flex flex-col gap-3 py-4 border-b border-border">
      {/* Category row */}
      <ScrollArea className="w-full">
        <div className="flex items-center gap-2 pb-2">
          {categories.map((cat) => (
            <FilterChip
              key={cat.id}
              label={cat.label}
              count={cat.count}
              hot={cat.hot}
              active={activeCategory === cat.id}
              onClick={() => setActiveCategory(cat.id)}
            />
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Level row */}
      <div className="flex items-center gap-2">
        {levels.map((lvl) => (
          <FilterChip
            key={lvl.id}
            label={lvl.label}
            active={activeLevel === lvl.id}
            onClick={() => setActiveLevel(lvl.id)}
          />
        ))}
      </div>
    </div>
  );
}
