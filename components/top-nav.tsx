"use client";

import { BookOpen, CheckCircle2, TrendingUp, LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StatItemProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color?: string;
}

function StatItem({ icon, value, label, color = "text-foreground" }: Readonly<StatItemProps>) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-muted-foreground">{icon}</div>
      <div className="flex items-baseline gap-1">
        <span className={`text-sm font-bold ${color}`}>{value}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}

interface TopNavProps {
  title: string;
  subtitle?: string;
  showStats?: boolean;
}

export function TopNav({ title, subtitle, showStats = false }: Readonly<TopNavProps>) {
  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex flex-col">
        <h1 className="text-base font-bold text-foreground">{title}</h1>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>

      {showStats && (
        <div className="flex items-center gap-6">
          <StatItem
            icon={<BookOpen className="size-4" />}
            value={0}
            label="đang học"
          />
          <StatItem
            icon={<CheckCircle2 className="size-4 text-emerald-500" />}
            value={0}
            label="đã hoàn thành"
            color="text-emerald-400"
          />
          <StatItem
            icon={<TrendingUp className="size-4" />}
            value="0%"
            label="trung bình"
          />
          <Button variant="outline" size="sm" className="gap-2 border-border text-foreground hover:bg-white/5">
            <LayoutGrid className="size-4" />
            <span className="text-xs">Xem chủ đề</span>
          </Button>
        </div>
      )}
    </header>
  );
}
