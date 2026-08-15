"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Flame,
  Award,
  Headphones,
  Sparkles,
  ExternalLink,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

import { useUser } from "@/lib/user-context";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "streak" | "achievement" | "study" | "system";
  unread: boolean;
  link?: string;
  linkLabel?: string;
}

interface NotificationsPopoverProps {
  onClose?: () => void;
}

export function NotificationsPopover({ onClose }: Readonly<NotificationsPopoverProps>) {
  const { user, stats } = useUser();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const savedRead = localStorage.getItem("bap_notifications_read");
      if (savedRead) setReadIds(new Set(JSON.parse(savedRead)));
      const savedDismissed = localStorage.getItem("bap_notifications_dismissed");
      if (savedDismissed) setDismissedIds(new Set(JSON.parse(savedDismissed)));
    } catch {}
  }, []);

  const dynamicNotifications = React.useMemo<AppNotification[]>(() => {
    const list: AppNotification[] = [];

    // Due flashcards notification
    if ((stats?.dueCardsCount ?? 0) > 0) {
      list.push({
        id: `notif-due-${stats?.dueCardsCount}`,
        title: "Từ vựng FSRS cần ôn tập 📚",
        message: `Bạn có ${stats?.dueCardsCount} thẻ từ vựng đã đến thời điểm ôn tập lại hôm nay.`,
        time: "Hôm nay",
        type: "study",
        unread: !readIds.has(`notif-due-${stats?.dueCardsCount}`),
        link: "/vocabulary",
        linkLabel: "Ôn từ vựng ngay",
      });
    }

    // Streak notification
    if ((stats?.streakDays ?? 0) > 0) {
      list.push({
        id: `notif-streak-${stats?.streakDays}`,
        title: `Chuỗi luyện tập ${stats?.streakDays} ngày liên tiếp! 🔥`,
        message: "Tuyệt vời! Hoàn thành bài Dictation hôm nay để giữ vững phong độ Streak của bạn.",
        time: "Hôm nay",
        type: "streak",
        unread: !readIds.has(`notif-streak-${stats?.streakDays}`),
        link: "/dictation",
        linkLabel: "Luyện Dictation",
      });
    }

    // Assessment reminder
    if (!user?.currentLevel) {
      list.push({
        id: "notif-assessment-invite",
        title: "Kiểm tra năng lực CEFR & IELTS 🎯",
        message: "Làm bài test 5 phút để xác định trình độ và nhận lộ trình học tập cá nhân hóa.",
        time: "Gợi ý",
        type: "achievement",
        unread: !readIds.has("notif-assessment-invite"),
        link: "/assessment",
        linkLabel: "Kiểm tra năng lực",
      });
    }

    // Welcome notification
    list.push({
      id: "notif-welcome-system",
      title: "Chào mừng đến với IELTS Master Prep ✨",
      message: "Hệ thống luyện nghe nói phản xạ với AI, Spaced Repetition và chấm điểm tự động.",
      time: "Hệ thống",
      type: "system",
      unread: !readIds.has("notif-welcome-system"),
      link: "/home",
      linkLabel: "Khám phá trang chủ",
    });

    return list.filter((item) => !dismissedIds.has(item.id));
  }, [stats, user, readIds, dismissedIds]);

  const markAllRead = () => {
    const allIds = new Set([...readIds, ...dynamicNotifications.map((n) => n.id)]);
    setReadIds(allIds);
    try {
      localStorage.setItem("bap_notifications_read", JSON.stringify(Array.from(allIds)));
    } catch {}
  };

  const markItemRead = (id: string) => {
    const updated = new Set(readIds).add(id);
    setReadIds(updated);
    try {
      localStorage.setItem("bap_notifications_read", JSON.stringify(Array.from(updated)));
    } catch {}
  };

  const deleteItem = (id: string) => {
    const updated = new Set(dismissedIds).add(id);
    setDismissedIds(updated);
    try {
      localStorage.setItem("bap_notifications_dismissed", JSON.stringify(Array.from(updated)));
    } catch {}
  };

  const notifications = dynamicNotifications;
  const filtered = notifications.filter((n) =>
    filter === "unread" ? n.unread : true
  );

  const unreadCount = notifications.filter((n) => n.unread).length;

  const getIcon = (type: AppNotification["type"]) => {
    switch (type) {
      case "streak":
        return (
          <div className="size-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Flame className="size-4" />
          </div>
        );
      case "achievement":
        return (
          <div className="size-9 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0">
            <Award className="size-4" />
          </div>
        );
      case "study":
        return (
          <div className="size-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Headphones className="size-4" />
          </div>
        );
      default:
        return (
          <div className="size-9 rounded-xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-400 shrink-0">
            <Sparkles className="size-4" />
          </div>
        );
    }
  };

  return (
    <div className="w-80 sm:w-96 rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-border flex items-center justify-between bg-muted/30">
        <div className="flex items-center gap-2">
          <Bell className="size-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Thông báo</h3>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-extrabold">
              {unreadCount} mới
            </span>
          )}
        </div>

        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              title="Đánh dấu tất cả đã đọc"
              className="text-xs font-semibold text-muted-foreground hover:text-primary px-2 py-1 rounded-lg hover:bg-muted transition-colors flex items-center gap-1"
            >
              <CheckCheck className="size-3.5" />
              <span>Đọc tất cả</span>
            </button>
          )}
          {onClose && (
            <button
              onClick={onClose}
              className="size-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border/60 bg-background/40">
        <button
          onClick={() => setFilter("all")}
          className={cn(
            "text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors",
            filter === "all"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          )}
        >
          Tất cả ({notifications.length})
        </button>
        <button
          onClick={() => setFilter("unread")}
          className={cn(
            "text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors",
            filter === "unread"
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:bg-muted"
          )}
        >
          Chưa đọc ({unreadCount})
        </button>
      </div>

      {/* List */}
      <div className="max-h-[380px] overflow-y-auto divide-y divide-border/50">
        {filtered.length === 0 ? (
          <div className="py-12 text-center flex flex-col items-center gap-2 px-4">
            <div className="size-10 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
              <Bell className="size-5" />
            </div>
            <p className="text-xs font-semibold text-foreground">Không có thông báo nào</p>
            <p className="text-[11px] text-muted-foreground">
              {filter === "unread" ? "Bạn đã đọc hết tất cả thông báo" : "Hệ thống sẽ cập nhật thông báo mới tại đây"}
            </p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className={cn(
                "p-3.5 flex items-start gap-3 transition-colors relative group",
                item.unread ? "bg-primary/5 hover:bg-primary/10" : "hover:bg-muted/40"
              )}
            >
              {getIcon(item.type)}

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-bold text-foreground leading-snug">
                    {item.title}
                  </h4>
                  <span className="text-[10px] text-muted-foreground shrink-0 mt-0.5">
                    {item.time}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {item.message}
                </p>

                {item.link && (
                  <div className="pt-1.5">
                    <Link
                      href={item.link}
                      onClick={() => {
                        markItemRead(item.id);
                        onClose?.();
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                    >
                      <span>{item.linkLabel || "Xem chi tiết"}</span>
                      <ExternalLink className="size-3" />
                    </Link>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {item.unread && (
                  <button
                    onClick={() => markItemRead(item.id)}
                    title="Đánh dấu đã đọc"
                    className="size-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                  >
                    <Check className="size-3.5" />
                  </button>
                )}
                <button
                  onClick={() => deleteItem(item.id)}
                  title="Xóa thông báo"
                  className="size-6 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-muted transition-colors"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>

              {item.unread && (
                <span className="absolute left-1.5 top-5 size-1.5 rounded-full bg-primary" />
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-border bg-muted/20 flex items-center justify-between text-[11px]">
        <Link
          href="/settings"
          onClick={onClose}
          className="text-muted-foreground hover:text-foreground transition-colors font-semibold"
        >
          Cài đặt thông báo →
        </Link>
        <span className="text-muted-foreground">Tự động cập nhật real-time</span>
      </div>
    </div>
  );
}
