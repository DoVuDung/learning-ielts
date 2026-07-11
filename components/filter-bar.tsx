"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Flame, Filter } from "lucide-react";

export interface CategoryOption {
  id: string;
  label: string;
  count: number;
  hot?: boolean;
}

export interface LevelOption {
  id: string;
  label: string;
  count: number;
}

interface FilterBarProps {
  categories: CategoryOption[];
  levels: LevelOption[];
}

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
        "flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-semibold transition-all duration-200 select-none",
        active
          ? "bg-primary text-on-primary shadow-md shadow-primary/25 border border-primary scale-100"
          : "bg-card border border-border text-muted-foreground hover:border-primary/40 hover:text-foreground hover:bg-white/5",
      )}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span
          className={cn(
            "text-[11px] font-medium rounded-full px-1.5 py-0.2",
            active ? "bg-black/20 text-white" : "text-muted-foreground",
          )}
        >
          {count}
        </span>
      )}
      {hot && <Flame className="size-3 text-amber-400 fill-amber-400" />}
    </button>
  );
}

export function FilterBar({ categories, levels }: Readonly<FilterBarProps>) {
  const router = useRouter();
  const params = useSearchParams();

  const activeCategory = params.get("category") ?? "all";
  const activeLevel = params.get("level") ?? "all-levels";

  const setParam = useCallback(
    (key: string, value: string, defaultVal: string) => {
      const next = new URLSearchParams(params.toString());
      if (value === defaultVal) next.delete(key);
      else next.set(key, value);
      router.push(`?${next.toString()}`, { scroll: false });
    },
    [params, router],
  );

  return (
    <div className="flex flex-col gap-3 py-4 border-b border-border/80">
      {/* Category row */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-muted-foreground shrink-0 pr-1">
          <Filter className="size-3.5 text-primary" />
          <span>Chủ đề:</span>
        </div>
        <ScrollArea className="w-full">
          <div className="flex items-center gap-2 pb-2">
            <FilterChip
              label="Tất cả"
              active={activeCategory === "all"}
              onClick={() => setParam("category", "all", "all")}
            />
            {categories.map((cat) => (
              <FilterChip
                key={cat.id}
                label={cat.label}
                count={cat.count}
                hot={cat.hot}
                active={activeCategory === cat.id}
                onClick={() => setParam("category", cat.id, "all")}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>

      {/* Level row */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-muted-foreground shrink-0 pr-1">
          <span className="size-1.5 rounded-full bg-primary" />
          <span>Trình độ:</span>
        </div>
        <ScrollArea className="w-full">
          <div className="flex items-center gap-2 pb-1">
            <FilterChip
              label="Tất cả trình độ"
              active={activeLevel === "all-levels"}
              onClick={() => setParam("level", "all-levels", "all-levels")}
            />
            {levels.map((lvl) => (
              <FilterChip
                key={lvl.id}
                label={lvl.label}
                count={lvl.count}
                active={activeLevel === lvl.id}
                onClick={() => setParam("level", lvl.id, "all-levels")}
              />
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}
