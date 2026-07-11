"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Target,
  Award,
  Clock,
  Sparkles,
  CheckCircle2,
  TrendingUp,
  Compass,
  ArrowRight,
  Flame,
} from "lucide-react";
import { usersApi, type UserTarget } from "@/lib/api-client";

const IELTS_BANDS = [
  { band: 5.5, cefr: "B1", label: "Intermediate", desc: "Nền tảng giao tiếp cơ bản" },
  { band: 6.0, cefr: "B2", label: "Upper Intermediate", desc: "Đủ điều kiện du học cơ bản" },
  { band: 6.5, cefr: "B2", label: "Upper Intermediate+", desc: "Mục tiêu phổ biến cho ĐH & Làm việc" },
  { band: 7.0, cefr: "C1", label: "Advanced", desc: "Sử dụng thành thạo & tự nhiên" },
  { band: 7.5, cefr: "C1+", label: "Advanced Professional", desc: "Ngôn ngữ học thuật sắc bén" },
  { band: 8.0, cefr: "C2", label: "Mastery", desc: "Trình độ chuyên gia xuất sắc" },
];

const DAILY_GOALS = [
  { minutes: 15, label: "Nhẹ nhàng", desc: "Duy trì thói quen 1 video dictation/ngày" },
  { minutes: 30, label: "Tiêu chuẩn", desc: "Dictation + 20 từ vựng Spaced Repetition" },
  { minutes: 45, label: "Tăng tốc", desc: "Luyện trọn bộ Nghe - Nói - Từ vựng" },
  { minutes: 60, label: "Quyết tâm cao", desc: "Chinh phục target trong thời gian ngắn nhất" },
];

export default function TargetPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedBand, setSelectedBand] = useState<number>(6.5);
  const [selectedCefr, setSelectedCefr] = useState<string>("B2");
  const [dailyMinutes, setDailyMinutes] = useState<number>(30);
  const [currentLevel, setCurrentLevel] = useState<string | null>(null);
  const [assessedIelts, setAssessedIelts] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await usersApi.getTarget();
        if (data.targetIeltsBand) setSelectedBand(data.targetIeltsBand);
        if (data.targetCefrLevel) setSelectedCefr(data.targetCefrLevel);
        if (data.dailyMinutesTarget) setDailyMinutes(data.dailyMinutesTarget);
        if (data.currentLevel) setCurrentLevel(data.currentLevel);
        if (data.latestAssessment) {
          setAssessedIelts(data.latestAssessment.ieltsBand);
        }
      } catch (err: any) {
        setError(err.message || "Không thể tải mục tiêu");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleSelectBand = (band: number, cefr: string) => {
    setSelectedBand(band);
    setSelectedCefr(cefr);
    setSavedSuccess(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setSavedSuccess(false);
    setError(null);
    try {
      await usersApi.updateTarget({
        targetIeltsBand: selectedBand,
        targetCefrLevel: selectedCefr,
        dailyMinutesTarget: dailyMinutes,
      });
      setSavedSuccess(true);
    } catch (err: any) {
      setError(err.message || "Lỗi khi lưu mục tiêu");
    } finally {
      setSaving(false);
    }
  };

  const gapBand = assessedIelts ? Math.max(0, Number((selectedBand - assessedIelts).toFixed(1))) : null;

  return (
    <div className="flex-1 overflow-y-auto bg-gradient-to-b from-background via-background/95 to-background p-6 lg:p-10">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
              <Target className="size-3.5" />
              Learning Goals & Path
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Mục Tiêu Học Tập & Lộ Trình
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Thiết lập mục tiêu IELTS Band mong muốn và cam kết thời gian luyện tập mỗi ngày.
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || loading}
            className="inline-flex items-center justify-center gap-2.5 px-7 py-3 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-xl shadow-primary/25 transition-all disabled:opacity-50 shrink-0"
          >
            {saving ? "Đang lưu..." : "Lưu Mục Tiêu"}
            <CheckCircle2 className="size-4" />
          </button>
        </div>

        {savedSuccess && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-sm font-semibold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="size-5 shrink-0" />
            Đã cập nhật mục tiêu học tập thành công! Hệ thống sẽ cá nhân hóa lộ trình theo mục tiêu mới.
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-semibold">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-20 text-center text-muted-foreground">Đang tải cấu hình mục tiêu...</div>
        ) : (
          <div className="space-y-10">
            {/* Current Competency vs Target Gap Analysis */}
            <div className="bg-card/80 backdrop-blur-xl border border-border/80 rounded-3xl p-6 lg:p-8 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    PHÂN TÍCH KHOẢNG CÁCH NĂNG LỰC
                  </div>
                  <h3 className="text-xl font-bold text-foreground flex items-center gap-2">
                    <Compass className="size-5 text-primary" />
                    Định vị Trình độ hiện tại vs Mục tiêu
                  </h3>
                  {assessedIelts ? (
                    <p className="text-sm text-muted-foreground">
                      Bạn đã được đánh giá đạt IELTS <strong>{assessedIelts.toFixed(1)}</strong> ({currentLevel}).
                      {gapBand && gapBand > 0 ? (
                        <span> Cần tăng thêm <strong>+{gapBand} Band</strong> để đạt mục tiêu <strong>{selectedBand.toFixed(1)}</strong>.</span>
                      ) : (
                        <span> Tuyệt vời! Bạn đã đạt hoặc vượt mục tiêu hiện tại!</span>
                      )}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      Bạn chưa thực hiện bài kiểm tra năng lực đầu vào. Hãy làm bài test 5 phút để hệ thống đánh giá chính xác!
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <div className="px-5 py-3 rounded-2xl bg-muted/60 border border-border text-center">
                    <div className="text-[11px] text-muted-foreground font-semibold">HIỆN TẠI</div>
                    <div className="text-xl font-black text-foreground">
                      {assessedIelts ? `${assessedIelts.toFixed(1)}` : "Chưa test"}
                    </div>
                  </div>
                  <ArrowRight className="size-5 text-muted-foreground" />
                  <div className="px-5 py-3 rounded-2xl bg-primary/10 border border-primary/20 text-center">
                    <div className="text-[11px] text-primary font-semibold">MỤC TIÊU</div>
                    <div className="text-xl font-black text-primary">{selectedBand.toFixed(1)}</div>
                  </div>
                </div>
              </div>

              {!assessedIelts && (
                <div className="mt-6 pt-5 border-t border-border/60 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Kiểm tra 3 kỹ năng: Nghe Dictation - Từ vựng - Ngữ pháp
                  </span>
                  <Link
                    href="/assessment"
                    className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:underline"
                  >
                    Làm bài kiểm tra năng lực ngay →
                  </Link>
                </div>
              )}
            </div>

            {/* Section 1: Target IELTS Band */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">1. Chọn Target IELTS Band mong muốn</h3>
                <p className="text-sm text-muted-foreground">
                  Hệ thống sẽ điều chỉnh độ khó gợi ý của các video Dictation và Shadowing phù hợp với thang điểm này.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {IELTS_BANDS.map((item) => {
                  const isSelected = selectedBand === item.band;
                  return (
                    <button
                      key={item.band}
                      onClick={() => handleSelectBand(item.band, item.cefr)}
                      className={`
                        p-5 rounded-3xl border text-left transition-all relative overflow-hidden
                        ${
                          isSelected
                            ? "bg-primary/10 border-primary shadow-xl shadow-primary/10"
                            : "bg-card/60 border-border hover:border-primary/40 hover:bg-muted/40"
                        }
                      `}
                    >
                      {isSelected && (
                        <div className="absolute top-4 right-4 text-primary">
                          <CheckCircle2 className="size-5" />
                        </div>
                      )}
                      <div className="flex items-center gap-2.5 mb-2">
                        <span className="text-2xl font-black text-foreground">
                          {item.band.toFixed(1)}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground text-xs font-bold">
                          {item.cefr}
                        </span>
                      </div>
                      <div className="font-bold text-sm text-foreground">{item.label}</div>
                      <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Daily Study Goal */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">2. Cam kết thời gian luyện tập mỗi ngày</h3>
                <p className="text-sm text-muted-foreground">
                  Duy trì đều đặn mỗi ngày là chìa khóa để nâng cao phản xạ nghe nói tiếng Anh.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {DAILY_GOALS.map((goal) => {
                  const isSelected = dailyMinutes === goal.minutes;
                  return (
                    <button
                      key={goal.minutes}
                      onClick={() => {
                        setDailyMinutes(goal.minutes);
                        setSavedSuccess(false);
                      }}
                      className={`
                        p-5 rounded-3xl border text-left transition-all relative
                        ${
                          isSelected
                            ? "bg-emerald-500/10 border-emerald-500 shadow-xl shadow-emerald-500/10"
                            : "bg-card/60 border-border hover:border-emerald-500/40 hover:bg-muted/40"
                        }
                      `}
                    >
                      {isSelected && (
                        <div className="absolute top-4 right-4 text-emerald-500">
                          <CheckCircle2 className="size-5" />
                        </div>
                      )}
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="size-5 text-emerald-500" />
                        <span className="text-2xl font-black text-foreground">
                          {goal.minutes}
                        </span>
                        <span className="text-xs font-bold text-muted-foreground">phút/ngày</span>
                      </div>
                      <div className="font-bold text-sm text-foreground">{goal.label}</div>
                      <p className="text-xs text-muted-foreground mt-1">{goal.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
