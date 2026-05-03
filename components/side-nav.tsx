"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  Crown,
  LogOut,
  ChevronUp,
  Sun,
  Languages,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemePickerDropdown, useTheme } from "@/components/theme-picker";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useState } from "react";
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
    items: [{ icon: Home, label: "Trang chủ", href: "/home" }],
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

export function SideNav({ onNavigate }: Readonly<{ onNavigate?: () => void }>) {
  const pathname = usePathname();
  const router = useRouter();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.push("/login");
    }
  }

  return (
    <aside className="flex flex-col w-56 shrink-0 h-screen bg-sidebar border-r border-sidebar-border overflow-hidden">
      {/* Logo */}
      <div className="flex items-center gap-2 px-4 py-5 shrink-0">
        <Image src="/logo.svg" alt="BapEnglish" width={32} height={32} className="rounded-lg" />
        <span className="text-foreground font-bold text-lg tracking-tight">BapEnglish</span>
      </div>

      <Separator className="bg-sidebar-border shrink-0" />

      {/* Nav — scrollable */}
      <nav className="flex flex-col gap-5 px-3 py-4 flex-1 overflow-y-auto scrollbar-thin">
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
                  onClick={onNavigate}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/15 text-primary"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                  )}
                >
                  <item.icon className={cn("size-4 shrink-0", isActive && "text-primary")} />
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

      <Separator className="bg-sidebar-border shrink-0" />

      {/* Upgrade banner */}
      <div className="px-3 py-3 shrink-0">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-primary/10 border border-primary/20 cursor-pointer hover:bg-primary/15 transition-colors">
          <Crown className="size-4 text-primary shrink-0" />
          <span className="text-xs font-semibold text-primary">Nâng cấp Premium</span>
        </div>
      </div>

      {/* User profile + logout + theme + language */}
      <div className="relative shrink-0 border-t border-sidebar-border">
        {/* Logout popup */}
        {userMenuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setUserMenuOpen(false)} />
            <div className="absolute bottom-full left-3 right-3 mb-2 z-20 rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-xs font-medium text-foreground truncate">dung …</p>
                <p className="text-[10px] text-muted-foreground">Miễn phí</p>
              </div>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="size-4 shrink-0" />
                {loggingOut ? "Đang đăng xuất…" : "Đăng xuất"}
              </button>
            </div>
          </>
        )}

        {/* Theme dropdown */}
        {themeOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setThemeOpen(false)} />
            <div className="absolute bottom-full right-3 mb-2 z-20 w-44 rounded-xl border border-border bg-card shadow-2xl overflow-hidden">
              <ThemePickerDropdown onClose={() => setThemeOpen(false)} />
            </div>
          </>
        )}

        <div className="flex items-center gap-1 px-3 py-3">
          {/* Avatar + name */}
          <button
            onClick={() => { setUserMenuOpen((v) => !v); setThemeOpen(false); }}
            className="flex items-center gap-2 flex-1 min-w-0 hover:bg-white/5 rounded-lg px-1 py-1 transition-colors"
          >
            <Avatar className="size-7 shrink-0">
              <AvatarImage src="https://api.dicebear.com/7.x/avataaars/svg?seed=dung" />
              <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">D</AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 flex-1 text-left">
              <span className="text-xs font-medium truncate">dung …</span>
              <span className="text-[10px] text-muted-foreground">Miễn phí</span>
            </div>
            <ChevronUp
              className={cn(
                "size-3.5 text-muted-foreground shrink-0 transition-transform",
                userMenuOpen && "rotate-180",
              )}
            />
          </button>

          {/* Theme icon button */}
          <button
            onClick={() => { setThemeOpen((v) => !v); setUserMenuOpen(false); }}
            title="Chọn giao diện"
            className={cn(
              "size-7 flex items-center justify-center rounded-lg transition-colors shrink-0",
              themeOpen ? "bg-primary/15 text-primary" : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
            )}
          >
            <Sun className="size-4" />
          </button>

          {/* Language icon button */}
          <button
            title="Ngôn ngữ giao diện"
            className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors shrink-0"
          >
            <Languages className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
