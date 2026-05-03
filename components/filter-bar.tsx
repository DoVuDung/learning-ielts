"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Flame } from "lucide-react";

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
        "flex items-center gap-1 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-all",
        active
          ? "bg-primary text-white shadow-sm shadow-primary/30"
          : "bg-white/5 text-muted-foreground hover:bg-white/10 hover:text-foreground",
      )}
    >
      {label}
      {count !== undefined && (
        <span className={cn("text-xs", active ? "text-white/80" : "text-muted-foreground")}>
          ({count})
        </span>
      )}
      {hot && <Flame className="size-3 text-orange-400" />}
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
    <div className="flex flex-col gap-3 py-4 border-b border-border">
      {/* Category row */}
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

      {/* Level row */}
      <div className="flex items-center gap-2">
        <FilterChip
          label="Tất cả cấp độ"
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
    </div>
  );
}
