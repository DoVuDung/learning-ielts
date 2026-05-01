"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Headphones,
  Mic2,
  MessageSquare,
  BookOpen,
  Star,
  BookMarked,
  BarChart2,
  TrendingUp,
  ChevronUp,
  Crown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  icon: LucideIcon;
  label: string;
  href: string;
  active?: boolean;
  badge?: string;
}

interface NavSection {
  label: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    label: "TỔNG QUAN",
    items: [
      { icon: Home, label: "Trang chủ", href: "/" },
    ],
  },
  {
    label: "LUYỆN TẬP",
    items: [
      { icon: Headphones, label: "Dictation", href: "/dictation" },
      { icon: Mic2, label: "Shadowing", href: "/shadowing" },
      { icon: MessageSquare, label: "Luyện nói", href: "/speaking" },
      { icon: BookOpen, label: "Luyện từ vựng", href: "/vocabulary" },
    ],
  },
  {
    label: "THƯ VIỆN",
    items: [
      { icon: Star, label: "Video của tôi", href: "/my-videos" },
      { icon: BookMarked, label: "Danh sách từ", href: "/word-lists", badge: "0" },
      { icon: BookOpen, label: "Từ điển AI", href: "/dictionary" },
    ],
  },
  {
    label: "TIẾN ĐỘ",
    items: [
      { icon: BarChart2, label: "Xếp hạng", href: "/leaderboard" },
      { icon: TrendingUp, label: "Thống kê", href: "/stats" },
    ],
  },
];

export function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-56 shrink-0 h-screen bg-sidebar border-r border-sidebar-border overflow-hidden">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5">
        <div className="flex items-center justify-center size-8 rounded-lg bg-primary">
          <span className="text-white font-bold text-sm">S</span>
        </div>
        <span className="text-foreground font-bold text-lg tracking-tight">SENGLISH</span>
      </div>

      <Separator className="bg-sidebar-border" />

      {/* Nav sections */}
      <nav className="flex flex-col gap-5 px-3 py-4 flex-1 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.label} className="flex flex-col gap-1">
            <p className="px-2 text-[10px] font-semibold tracking-widest text-muted-foreground mb-1">
              {section.label}
            </p>
            {section.items.map((item) => {
              const isActive = item.active || pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                  )}
                >
                  <item.icon
                    className={cn("size-4 shrink-0", isActive && "text-primary")}
                  />
                  <span className="truncate">{item.label}</span>
                  {item.badge !== undefined && (
                    <Badge
                      variant="secondary"
                      className="ml-auto text-[10px] px-1.5 py-0 h-4 min-w-4 flex items-center justify-center"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      <Separator className="bg-sidebar-border" />

      {/* Upgrade banner */}
      <div className="px-3 py-3">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-primary/10 border border-primary/20 cursor-pointer hover:bg-primary/15 transition-colors">
          <Crown className="size-4 text-primary shrink-0" />
          <span className="text-xs font-semibold text-primary">Nâng cấp Premium</span>
        </div>
      </div>

      {/* User profile */}
      <div className="flex items-center gap-3 px-4 py-4 border-t border-sidebar-border">
        <Avatar className="size-8">
          <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=dung" />
          <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">D</AvatarFallback>
        </Avatar>
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-sm font-medium truncate">dung …</span>
          <span className="text-xs text-muted-foreground">@ Miễn phí</span>
        </div>
        <ChevronUp className="size-4 text-muted-foreground shrink-0" />
      </div>
    </aside>
  );
}
