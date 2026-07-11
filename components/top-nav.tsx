"use client";

import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  TrendingUp,
  LayoutGrid,
  Search,
  Flame,
  Bell,
  Settings,
  Crown,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface StatItemProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  color?: string;
}

function StatItem({
  icon,
  value,
  label,
  color = "text-foreground",
}: Readonly<StatItemProps>) {
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
  showSearch?: boolean;
}

export function TopNav({
  title,
  subtitle,
  showStats = false,
  showSearch = false,
}: Readonly<TopNavProps>) {
  return (
    <header className="flex items-center justify-between px-6 py-3.5 border-b border-border bg-background/90 backdrop-blur-md sticky top-0 z-30 transition-all">
      <div className="flex flex-col gap-0.5">
        <div className="flex items-center gap-2.5">
          <h1 className="text-base font-bold text-foreground tracking-tight">
            {title}
          </h1>
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary border border-primary/20">
            IELTS Prep
          </span>
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground leading-normal">
            {subtitle}
          </p>
        )}
      </div>

      <div className="flex items-center gap-4">
        {showSearch && (
          <div className="hidden md:flex relative items-center w-64 lg:w-80">
            <Search className="size-4 absolute left-3 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm kiếm bài học, từ vựng..."
              className="w-full bg-card/80 border border-border rounded-full py-1.5 pl-9 pr-4 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
          </div>
        )}

        {showStats ? (
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
            <Button
              variant="outline"
              size="sm"
              className="gap-2 border-border text-foreground hover:bg-white/5"
            >
              <LayoutGrid className="size-4" />
              <span className="text-xs">Xem chủ đề</span>
            </Button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            {/* Upgrade PRO Badge */}
            <Link
              href="/upgrade"
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/20 via-yellow-500/20 to-amber-500/20 border border-amber-500/40 text-amber-300 hover:from-amber-500/30 hover:to-yellow-500/30 transition-all group shadow-sm"
            >
              <Crown className="size-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
              <span className="text-xs font-bold tracking-wide">Nâng cấp PRO</span>
            </Link>

            {/* Streak Indicator matching V3 */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Flame className="size-3.5 fill-amber-400 text-amber-400 animate-pulse" />
              <span className="text-xs font-bold">12 Ngày</span>
            </div>

            <div className="flex items-center gap-1 border-l border-border pl-3">
              <button
                title="Thông báo"
                className="size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors relative"
              >
                <Bell className="size-4" />
                <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-primary" />
              </button>
              <button
                title="Cài đặt"
                className="size-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
              >
                <Settings className="size-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
