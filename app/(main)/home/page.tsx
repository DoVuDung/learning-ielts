"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Headphones,
  Mic2,
  MessageSquare,
  BookOpen,
  Star,
  BookMarked,
  Target,
  TrendingUp,
  ArrowUpRight,
  Play,
  Sparkles,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/lib/user-context";
import { usersApi, type UserTarget } from "@/lib/api-client";
import { TopNav } from "@/components/top-nav";

interface Feature {
  href: string;
  icon: React.ElementType;
  title: string;
  badge?: string;
  badgeColor?: string;
  description: string;
  steps: string[];
  tip: string;
  accentClass: string;
  borderClass: string;
  glowClass: string;
}

const features: Feature[] = [
  {
    href: "/dictation",
    icon: Headphones,
    title: "Dictation",
    badge: "Phổ biến nhất",
    badgeColor: "bg-primary/20 text-primary border border-primary/30",
    description:
      "Nghe và chép lại từng câu chuẩn xác từ video YouTube thực tế — phương pháp luyện nghe sâu và nhớ từ vựng lâu nhất.",
    steps: [
      "Nghe đoạn hội thoại phát ra từ video YouTube thật",
      "Gõ lại câu bạn nghe được vào ô nhập liệu",
      "Kiểm tra kết quả ngay lập tức với AI gợi ý",
    ],
    tip: "Dùng phím Tab để phát lại, Enter để kiểm tra — không cần rời bàn phím.",
    accentClass: "text-primary bg-primary/10 border-primary/20",
    borderClass: "border-primary/20 hover:border-primary/50",
    glowClass: "group-hover:shadow-[0_0_25px_rgba(236,72,153,0.15)]",
  },
  {
    href: "/shadowing",
    icon: Mic2,
    title: "Shadowing",
    badge: "Phát âm chuẩn",
    badgeColor: "bg-violet-500/20 text-violet-400 border border-violet-500/30",
    description:
      "Lặp lại từng câu theo ngữ điệu và tốc độ của người bản ngữ — khắc phục lỗi nối âm và cải thiện phản xạ phát âm.",
    steps: [
      "Nghe câu mẫu bản ngữ với tốc độ tùy chọn",
      "Lặp lại to rõ theo đúng trọng âm và ngữ điệu",
      "Xem transcript song ngữ ngay bên cạnh",
    ],
    tip: "Kéo thanh dưới video để điều chỉnh kích thước và bật lặp lại tự động.",
    accentClass: "text-violet-400 bg-violet-500/10 border-violet-500/20",
    borderClass: "border-violet-500/20 hover:border-violet-500/50",
    glowClass: "group-hover:shadow-[0_0_25px_rgba(139,92,246,0.15)]",
  },
  {
    href: "/speaking",
    icon: MessageSquare,
    title: "Luyện nói & AI",
    badge: "Mới",
    badgeColor: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
    description:
      "Luyện trả lời câu hỏi thực tế theo chủ đề IELTS, được AI phân tích ngữ pháp, từ vựng và gợi ý cải thiện cấu trúc câu.",
    steps: [
      "Chọn chủ đề IELTS Part 1, 2 hoặc 3",
      "Ghi âm hoặc gõ câu trả lời của bạn",
      "Nhận phân tích chi tiết từ trợ lý AI",
    ],
    tip: "Áp dụng cấu trúc nối câu và từ vựng nâng cao do AI gợi ý.",
    accentClass: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    borderClass: "border-emerald-500/20 hover:border-emerald-500/50",
    glowClass: "group-hover:shadow-[0_0_25px_rgba(16,185,129,0.15)]",
  },
  {
    href: "/vocabulary",
    icon: BookOpen,
    title: "Từ vựng Spaced Repetition",
    badge: "FSRS AI",
    badgeColor: "bg-amber-500/20 text-amber-400 border border-amber-500/30",
    description:
      "Ôn tập từ vựng đã lưu bằng thuật toán lặp lại ngắt quãng FSRS chuẩn khoa học — tự động nhắc lại đúng lúc bạn sắp quên.",
    steps: [
      "Lưu từ vựng trực tiếp khi học Dictation/Shadowing",
      "Hệ thống tạo Flashcard kèm ngữ cảnh video gốc",
      "Ôn tập mỗi ngày theo chỉ số ghi nhớ tự động",
    ],
    tip: "Chỉ cần 5 phút mỗi ngày để duy trì 100% từ vựng trong bộ nhớ dài hạn.",
    accentClass: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    borderClass: "border-amber-500/20 hover:border-amber-500/50",
    glowClass: "group-hover:shadow-[0_0_25px_rgba(245,158,11,0.15)]",
  },
];

export default function HomePage() {
  const { user, loading } = useUser();
  const [target, setTarget] = useState<UserTarget | null>(null);

  useEffect(() => {
    usersApi.getTarget().then(setTarget).catch(() => {});
  }, []);

  return (
    <>
      <TopNav
        title="Trang chủ"
        subtitle="Hệ thống luyện nghe nói IELTS toàn diện"
        showSearch
      />

      <main className="flex-1 overflow-y-auto px-6 py-8 max-w-7xl mx-auto w-full">
        {/* Hero Section matching Stitch V3 Dashboard */}
        <section className="mb-10 relative overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-card via-card/90 to-primary/10 p-7 md:p-8 shadow-xl">
          <div className="absolute -right-10 -bottom-10 size-64 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div className="flex flex-col gap-2 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-bold w-fit">
                <Sparkles className="size-3.5" />
                <span>IELTS MASTER PREP V3</span>
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
                Chào mừng trở lại,{" "}
                <span className="text-primary">
                  {loading ? "bạn" : user?.name || "Học viên"}
                </span>
                ! 👋
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Bạn đang giữ chuỗi luyện tập{" "}
                <span className="text-amber-400 font-bold">12 ngày liên tiếp</span>
                . Hoàn thành bài Dictation hôm nay để duy trì phong độ cực đỉnh!
              </p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <Link
                href="/assessment"
                className="flex-1 md:flex-none rounded-xl border border-border bg-background/60 hover:bg-background/90 backdrop-blur-md px-4 py-3 flex flex-col items-center min-w-[130px] transition-colors"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Trình độ hiện tại
                </span>
                <span className="text-xl font-black text-primary mt-0.5">
                  {target?.latestAssessment ? `IELTS ${target.latestAssessment.ieltsBand.toFixed(1)}` : target?.currentLevel || "Kiểm tra →"}
                </span>
              </Link>
              <Link
                href="/target"
                className="flex-1 md:flex-none rounded-xl border border-border bg-background/60 hover:bg-background/90 backdrop-blur-md px-4 py-3 flex flex-col items-center min-w-[130px] transition-colors"
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                  Mục tiêu IELTS
                </span>
                <span className="text-xl font-black text-emerald-400 mt-0.5">
                  {target?.targetIeltsBand ? `${target.targetIeltsBand.toFixed(1)}+` : "Cài đặt →"}
                </span>
              </Link>
            </div>
          </div>

          {/* Daily Goal Progress Bar */}
          <div className="mt-6 pt-6 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
                <Target className="size-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-foreground">
                    Mục tiêu ngày hôm nay
                  </span>
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    15 / 20 câu Dictation
                  </span>
                </div>
                <div className="w-48 sm:w-64 h-2 bg-background rounded-full overflow-hidden mt-1.5 border border-border">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-amber-400 rounded-full transition-all duration-500"
                    style={{ width: "75%" }}
                  />
                </div>
              </div>
            </div>

            <Link
              href="/dictation"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-on-primary text-xs font-bold shadow-lg hover:brightness-110 transition-all w-fit"
            >
              <span>Tiếp tục học ngay</span>
              <Play className="size-3.5 fill-current" />
            </Link>
          </div>
        </section>

        {/* Core Learning Modules Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-foreground">
              Các tính năng chính
            </h3>
            <p className="text-xs text-muted-foreground">
              Phương pháp luyện tập theo chu kỳ khép kín Nghe — Nói — Nhớ
            </p>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-12">
          {features.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className={cn(
                "group relative flex flex-col justify-between rounded-2xl border bg-card/80 backdrop-blur-md p-6 transition-all duration-300 hover:-translate-y-1",
                f.borderClass,
                f.glowClass,
              )}
            >
              <div>
                {/* Card Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3.5">
                    <div
                      className={cn(
                        "flex items-center justify-center size-11 rounded-xl border",
                        f.accentClass,
                      )}
                    >
                      <f.icon className="size-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-foreground group-hover:text-primary transition-colors">
                          {f.title}
                        </span>
                        {f.badge && (
                          <span
                            className={cn(
                              "text-[10px] font-bold px-2 py-0.5 rounded-full",
                              f.badgeColor,
                            )}
                          >
                            {f.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
                        {f.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Steps */}
                <div className="space-y-2 my-5 pl-1">
                  {f.steps.map((step, idx) => (
                    <div
                      key={step}
                      className="flex items-center gap-2.5 text-xs text-muted-foreground"
                    >
                      <span className="size-5 rounded-full bg-white/5 border border-border flex items-center justify-center text-[10px] font-bold text-foreground shrink-0">
                        {idx + 1}
                      </span>
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Footer */}
              <div className="pt-4 border-t border-border/60 flex items-center justify-between mt-auto">
                <span className="text-[11px] text-muted-foreground italic truncate max-w-[70%]">
                  💡 {f.tip}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-primary group-hover:translate-x-1 transition-transform">
                  <span>Bắt đầu</span>
                  <ArrowUpRight className="size-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Access Library Section */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-base font-bold text-foreground">
              Thư viện nhanh
            </h3>
            <p className="text-xs text-muted-foreground">
              Xem lại video, danh sách từ và thống kê của bạn
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/my-videos"
            className="group rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-all flex items-center gap-3.5"
          >
            <div className="size-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shrink-0">
              <Star className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                Video của tôi
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Các video đã lưu hoặc import
              </p>
            </div>
          </Link>

          <Link
            href="/word-lists"
            className="group rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-all flex items-center gap-3.5"
          >
            <div className="size-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <BookMarked className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                Danh sách từ vựng
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Ôn tập bộ từ vựng cá nhân
              </p>
            </div>
          </Link>

          <Link
            href="/stats"
            className="group rounded-xl border border-border bg-card p-4 hover:border-primary/40 transition-all flex items-center gap-3.5"
          >
            <div className="size-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <TrendingUp className="size-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                Bảng phân tích tiến độ
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Xem thống kê chi tiết kỹ năng
              </p>
            </div>
          </Link>
        </div>
      </main>
    </>
  );
}
