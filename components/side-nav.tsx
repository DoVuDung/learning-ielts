"use client";

import Image from "next/image";
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
  LogOut,
  ChevronUp,
  Sun,
  Sparkles,
  Target,
  Award,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { authApi } from "@/lib/api-client";
import { useUser } from "@/lib/user-context";
import { ThemePickerDropdown } from "@/components/theme-picker";
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
    items: [
      { icon: Home, label: "Trang chủ", href: "/home" },
      { icon: Target, label: "Mục tiêu học tập", href: "/target" },
    ],
  },
  {
    label: "LUYỆN TẬP",
    items: [
      { icon: Award, label: "Kiểm tra năng lực", href: "/assessment" },
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
      {
        icon: BookMarked,
        label: "Danh sách từ",
        href: "/word-lists",
        badge: "0",
      },
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

export function SideNav({
  onNavigate,
}: Readonly<{ onNavigate?: () => void }>) {
  const pathname = usePathname();
  const { user, loading } = useUser();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await authApi.logout();
    } catch {
      // Dù API lỗi vẫn xóa token và redirect
    } finally {
      setUserMenuOpen(false);
      try {
        localStorage.removeItem("access_token");
        sessionStorage.clear();
      } catch {}
      window.location.replace("/login");
    }
  }

  return (
    <aside className="flex flex-col w-[260px] shrink-0 h-screen bg-sidebar border-r border-sidebar-border overflow-hidden select-none">
      {/* Logo Header */}
      <div className="flex items-center justify-between px-5 py-5 shrink-0">
        <div className="flex items-center gap-2.5">
          <Image
            src="/logo.svg"
            alt="BapEnglish"
            width={32}
            height={32}
            className="rounded-xl shadow-md"
          />
          <div className="flex flex-col">
            <span className="text-foreground font-black text-base tracking-tight leading-none">
              BapEnglish
            </span>
            <span className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1">
              Mastery Portal
            </span>
          </div>
        </div>
      </div>

      <Separator className="bg-sidebar-border shrink-0" />

      {/* Nav — scrollable */}
      <nav className="flex flex-col gap-6 px-3.5 py-4 flex-1 overflow-y-auto scrollbar-thin">
        {navSections.map((section) => (
          <div key={section.label} className="flex flex-col gap-1">
            <p className="px-2.5 text-[10px] font-bold tracking-widest uppercase text-muted-foreground/70 mb-1">
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
                    "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary/15 text-primary font-semibold border-l-2 border-primary shadow-[0_0_15px_rgba(236,72,153,0.1)]"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground hover:translate-x-0.5",
                  )}
                >
                  <item.icon
                    className={cn(
                      "size-4 shrink-0 transition-transform group-hover:scale-110",
                      isActive ? "text-primary" : "text-muted-foreground",
                    )}
                  />
                  <span className="truncate">{item.label}</span>
                  {item.badge !== undefined && (
                    <Badge
                      variant="secondary"
                      className="ml-auto text-[10px] px-1.5 py-0 h-4 min-w-4 flex items-center justify-center bg-white/10 text-foreground"
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

      {/* Pro Upgrade Banner matching Stitch V3 */}
      <div className="px-3.5 py-3 shrink-0">
        <div className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-primary/25 via-primary/10 to-card border border-primary/30 p-3.5 transition-all hover:border-primary/60 cursor-pointer shadow-md">
          <div className="flex items-center justify-between mb-1.5">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary">
              <Sparkles className="size-3.5 animate-pulse" />
              NÂNG CẤP PRO
            </span>
            <span className="text-[9px] bg-primary text-on-primary px-1.5 py-0.5 rounded-full font-bold">
              VIP
            </span>
          </div>
          <p className="text-[11px] text-muted-foreground leading-snug">
            Mở khóa không giới hạn video C1/C2 & AI chấm chữa
          </p>
        </div>
      </div>

      {/* User profile + logout + theme */}
      <div className="relative shrink-0 border-t border-sidebar-border bg-card/40">
        {/* Logout popup */}
        {userMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setUserMenuOpen(false)}
            />
            <div className="absolute bottom-full left-3.5 right-3.5 mb-2 z-20 rounded-xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-xs font-bold text-foreground truncate">
                  {loading ? "Đang tải…" : user?.name || "Tài khoản"}
                </p>
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                  {loading ? "" : user?.email || ""}
                </p>
              </div>
              <a
                href={`http://localhost:5173/?token=${typeof window !== "undefined" ? localStorage.getItem("access_token") || "" : ""}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setUserMenuOpen(false)}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-xs font-bold text-amber-500 hover:bg-amber-500/10 transition-colors border-b border-border/60"
              >
                <span className="size-4 shrink-0 text-amber-500 flex items-center justify-center">👑</span>
                <span>Cổng Quản Trị (Admin Portal)</span>
              </a>
              <Link
                href="/settings"
                onClick={() => setUserMenuOpen(false)}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-xs font-semibold text-foreground hover:bg-muted transition-colors border-b border-border/60"
              >
                <Settings className="size-4 shrink-0 text-muted-foreground" />
                <span>Cài đặt hệ thống</span>
              </Link>
              <button
                onClick={handleLogout}
                disabled={loggingOut}
                className="w-full flex items-center gap-2.5 px-4 py-3 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="size-4 shrink-0" />
                {loggingOut ? "Đang đăng xuất…" : "Đăng xuất tài khoản"}
              </button>
            </div>
          </>
        )}

        {/* Theme dropdown */}
        {themeOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setThemeOpen(false)}
            />
            <div className="absolute bottom-full right-3.5 mb-2 z-20 w-48 rounded-xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
              <ThemePickerDropdown onClose={() => setThemeOpen(false)} />
            </div>
          </>
        )}

        <div className="flex items-center gap-1.5 px-3.5 py-3">
          {/* Avatar + name */}
          <button
            onClick={() => {
              setUserMenuOpen((v) => !v);
              setThemeOpen(false);
            }}
            className="flex items-center gap-2.5 flex-1 min-w-0 hover:bg-white/5 rounded-xl px-1.5 py-1.5 transition-colors text-left"
          >
            <Avatar className="size-8 shrink-0 ring-2 ring-primary/20">
              <AvatarImage
                src={
                  user?.avatarUrl ||
                  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.name || user?.email || "user")}`
                }
              />
              <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                {(user?.name?.[0] || user?.email?.[0] || "U").toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-bold truncate text-foreground">
                {loading ? "Đang tải…" : user?.name || "Tài khoản"}
              </span>
              <span className="text-[10px] font-medium text-primary truncate mt-0.5">
                B2 Upper Intermediate
              </span>
            </div>
            <ChevronUp
              className={cn(
                "size-3.5 text-muted-foreground shrink-0 transition-transform duration-200",
                userMenuOpen && "rotate-180",
              )}
            />
          </button>

          {/* Theme icon button */}
          <button
            onClick={() => {
              setThemeOpen((v) => !v);
              setUserMenuOpen(false);
            }}
            title="Chọn giao diện"
            className={cn(
              "size-8 flex items-center justify-center rounded-xl transition-colors shrink-0 border border-transparent",
              themeOpen
                ? "bg-primary/15 text-primary border-primary/30"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
            )}
          >
            <Sun className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
