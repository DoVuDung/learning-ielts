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

const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  {
    id: "notif-1",
    title: "Chuỗi luyện tập 12 ngày liên tiếp! 🔥",
    message: "Tuyệt vời! Hoàn thành thêm 1 bài Dictation hôm nay để giữ vững phong độ Streak của bạn.",
    time: "Vừa xong",
    type: "streak",
    unread: true,
    link: "/dictation",
    linkLabel: "Luyện Dictation ngay",
  },
  {
    id: "notif-2",
    title: "Cập nhật Kiểm tra năng lực CEFR & IELTS",
    message: "Tính năng đánh giá trình độ và cài đặt lộ trình IELTS cá nhân hóa vừa ra mắt. Khám phá ngay!",
    time: "2 giờ trước",
    type: "achievement",
    unread: true,
    link: "/assessment",
    linkLabel: "Kiểm tra năng lực",
  },
  {
    id: "notif-3",
    title: "Gợi ý từ vựng FSRS cần ôn tập",
    message: "Bạn có 15 từ vựng sắp đến thời điểm ôn tập lại trong Spaced Repetition.",
    time: "Hôm qua",
    type: "study",
    unread: false,
    link: "/vocabulary",
    linkLabel: "Ôn từ vựng",
  },
  {
    id: "notif-4",
    title: "Chào mừng đến với IELTS Prep V3 ✨",
    message: "Trải nghiệm giao diện mới với tốc độ tối ưu và chấm điểm phát âm AI chính xác hơn.",
    time: "3 ngày trước",
    type: "system",
    unread: false,
  },
];

interface NotificationsPopoverProps {
  onClose?: () => void;
}

export function NotificationsPopover({ onClose }: Readonly<NotificationsPopoverProps>) {
  const [notifications, setNotifications] = useState<AppNotification[]>(DEFAULT_NOTIFICATIONS);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    try {
      const saved = localStorage.getItem("bap_notifications");
      if (saved) {
        setNotifications(JSON.parse(saved));
      }
    } catch {
      // use defaults
    }
  }, []);

  const saveToStorage = (updated: AppNotification[]) => {
    setNotifications(updated);
    try {
      localStorage.setItem("bap_notifications", JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const markAllRead = () => {
    saveToStorage(notifications.map((n) => ({ ...n, unread: false })));
  };

  const markItemRead = (id: string) => {
    saveToStorage(
      notifications.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  };

  const deleteItem = (id: string) => {
    saveToStorage(notifications.filter((n) => n.id !== id));
  };

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
