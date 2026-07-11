"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Settings,
  User,
  Bell,
  Volume2,
  Shield,
  Target,
  CheckCircle2,
  Save,
  Clock,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { useUser } from "@/lib/user-context";
import { TopNav } from "@/components/top-nav";

export default function SettingsPage() {
  const { user, loading } = useUser();

  // Audio settings
  const [playbackSpeed, setPlaybackSpeed] = useState<string>("1.0");
  const [autoPlayAudio, setAutoPlayAudio] = useState<boolean>(true);
  const [showIpa, setShowIpa] = useState<boolean>(true);

  // Notification settings
  const [dailyReminder, setDailyReminder] = useState<boolean>(true);
  const [reminderTime, setReminderTime] = useState<string>("20:00");
  const [streakAlert, setStreakAlert] = useState<boolean>(true);
  const [weeklyReport, setWeeklyReport] = useState<boolean>(true);

  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem("bap_app_settings");
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.playbackSpeed) setPlaybackSpeed(parsed.playbackSpeed);
        if (parsed.autoPlayAudio !== undefined) setAutoPlayAudio(parsed.autoPlayAudio);
        if (parsed.showIpa !== undefined) setShowIpa(parsed.showIpa);
        if (parsed.dailyReminder !== undefined) setDailyReminder(parsed.dailyReminder);
        if (parsed.reminderTime) setReminderTime(parsed.reminderTime);
        if (parsed.streakAlert !== undefined) setStreakAlert(parsed.streakAlert);
        if (parsed.weeklyReport !== undefined) setWeeklyReport(parsed.weeklyReport);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleSave = () => {
    setSaving(true);
    setSaveSuccess(false);
    setTimeout(() => {
      try {
        localStorage.setItem(
          "bap_app_settings",
          JSON.stringify({
            playbackSpeed,
            autoPlayAudio,
            showIpa,
            dailyReminder,
            reminderTime,
            streakAlert,
            weeklyReport,
          })
        );
      } catch {
        // ignore
      }
      setSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    }, 400);
  };

  return (
    <>
      <TopNav
        title="Cài đặt hệ thống"
        subtitle="Tùy chỉnh thông báo, trải nghiệm luyện nghe và thông tin tài khoản"
      />

      <div className="flex-1 overflow-y-auto bg-gradient-to-b from-background via-background/95 to-background p-6 lg:p-10">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
                <Settings className="size-3.5" />
                System & Account Preferences
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
                Cài Đặt & Tùy Biến Trải Nghiệm
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Quản lý thông tin tài khoản, cấu hình thông báo học tập và thiết lập âm thanh Dictation.
              </p>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center justify-center gap-2.5 px-7 py-3 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-xl shadow-primary/25 transition-all shrink-0"
            >
              {saving ? "Đang lưu..." : "Lưu Tất Cả Cài Đặt"}
              <Save className="size-4" />
            </button>
          </div>

          {saveSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm font-semibold flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="size-5 shrink-0" />
              Đã lưu cài đặt thành công! Cấu hình đã được áp dụng ngay trên toàn bộ hệ thống.
            </div>
          )}

          {/* Section 1: Account Profile */}
          <div className="bg-card/80 backdrop-blur-xl border border-border/80 rounded-3xl p-6 lg:p-8 shadow-xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <User className="size-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Hồ sơ & Tài khoản</h3>
                <p className="text-xs text-muted-foreground">Thông tin đăng nhập và Trạng thái gói học</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
                <span className="text-xs font-semibold text-muted-foreground">Tên hiển thị</span>
                <div className="font-bold text-base text-foreground">
                  {loading ? "Đang tải..." : user?.name || "Học viên IELTS"}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-muted/40 border border-border/60 space-y-1">
                <span className="text-xs font-semibold text-muted-foreground">Email đăng nhập</span>
                <div className="font-bold text-base text-foreground">
                  {loading ? "Đang tải..." : user?.email || "Chưa cập nhật"}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-border/60">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-xs font-bold">
                  {user?.isPremium ? "PRO MEMBERSHIP" : "FREE PLAN"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {user?.isPremium
                    ? "Tài khoản được mở khóa trọn bộ tính năng AI"
                    : "Nâng cấp PRO để mở khóa không giới hạn Dictation & Luyện nói AI"}
                </span>
              </div>

              {!user?.isPremium && (
                <Link
                  href="/upgrade"
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-bold shadow-md shadow-primary/20 hover:bg-primary/90 transition-all"
                >
                  Nâng cấp PRO ngay
                </Link>
              )}
            </div>
          </div>

          {/* Section 2: Notifications Settings */}
          <div className="bg-card/80 backdrop-blur-xl border border-border/80 rounded-3xl p-6 lg:p-8 shadow-xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                <Bell className="size-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Cài đặt Thông báo & Nhắc nhở</h3>
                <p className="text-xs text-muted-foreground">Tùy chỉnh thời gian nhắc học và cảnh báo chuỗi Streak</p>
              </div>
            </div>

            <div className="space-y-4 divide-y divide-border/60">
              {/* Toggle 1 */}
              <div className="flex items-center justify-between pt-4 first:pt-0">
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-foreground">Nhắc nhở học tập hàng ngày</div>
                  <p className="text-xs text-muted-foreground">
                    Gửi thông báo nhắc hoàn thành chỉ tiêu Dictation / Từ vựng mỗi tối
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {dailyReminder && (
                    <input
                      type="time"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      className="px-3 py-1.5 rounded-xl border border-border bg-card text-xs font-bold text-foreground"
                    />
                  )}
                  <button
                    onClick={() => setDailyReminder(!dailyReminder)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      dailyReminder ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`size-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                        dailyReminder ? "right-0.5" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Toggle 2 */}
              <div className="flex items-center justify-between pt-4">
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-foreground">Cảnh báo bảo vệ chuỗi Streak</div>
                  <p className="text-xs text-muted-foreground">
                    Thông báo khẩn cấp khi sắp hết ngày mà bạn chưa duy trì chuỗi luyện tập
                  </p>
                </div>
                <button
                  onClick={() => setStreakAlert(!streakAlert)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    streakAlert ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`size-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                      streakAlert ? "right-0.5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>

              {/* Toggle 3 */}
              <div className="flex items-center justify-between pt-4">
                <div className="space-y-0.5">
                  <div className="text-sm font-bold text-foreground">Báo cáo tiến độ tuần qua Email</div>
                  <p className="text-xs text-muted-foreground">
                    Tổng hợp điểm số, từ vựng đã học và gợi ý lộ trình vào thứ Hai hàng tuần
                  </p>
                </div>
                <button
                  onClick={() => setWeeklyReport(!weeklyReport)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    weeklyReport ? "bg-primary" : "bg-muted"
                  }`}
                >
                  <span
                    className={`size-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                      weeklyReport ? "right-0.5" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Audio & Dictation Settings */}
          <div className="bg-card/80 backdrop-blur-xl border border-border/80 rounded-3xl p-6 lg:p-8 shadow-xl space-y-6">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                <Volume2 className="size-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground">Âm thanh & Trải nghiệm học</h3>
                <p className="text-xs text-muted-foreground">Tốc độ phát âm thanh và hiển thị phiên âm IPA</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-foreground">Tốc độ phát âm thanh mặc định</label>
                <div className="grid grid-cols-4 gap-2">
                  {["0.8", "1.0", "1.25", "1.5"].map((speed) => (
                    <button
                      key={speed}
                      onClick={() => setPlaybackSpeed(speed)}
                      className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                        playbackSpeed === speed
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-muted/40 border-border hover:bg-muted"
                      }`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground">Tự động phát audio khi sang câu mới</span>
                  <button
                    onClick={() => setAutoPlayAudio(!autoPlayAudio)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      autoPlayAudio ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`size-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                        autoPlayAudio ? "right-0.5" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-foreground">Hiển thị phiên âm IPA trợ giúp</span>
                  <button
                    onClick={() => setShowIpa(!showIpa)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      showIpa ? "bg-primary" : "bg-muted"
                    }`}
                  >
                    <span
                      className={`size-5 rounded-full bg-white absolute top-0.5 transition-transform ${
                        showIpa ? "right-0.5" : "left-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Target & Assessment Shortcut */}
          <div className="p-6 lg:p-8 rounded-3xl bg-gradient-to-r from-primary/15 via-emerald-500/10 to-transparent border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-primary uppercase">
                <Target className="size-4" />
                LỘ TRÌNH & MỤC TIÊU IELTS
              </div>
              <h4 className="text-lg font-extrabold text-foreground">
                Cập nhật Mục tiêu học tập cá nhân hóa
              </h4>
              <p className="text-xs text-muted-foreground">
                Điều chỉnh Target IELTS Band (5.5 - 8.5) hoặc làm bài đánh giá trình độ CEFR đầu vào.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/target"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs transition-all"
              >
                <span>Mục tiêu học tập</span>
                <ExternalLink className="size-3.5" />
              </Link>
              <Link
                href="/assessment"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-border bg-card hover:bg-muted font-bold text-xs transition-all"
              >
                <span>Kiểm tra năng lực</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
