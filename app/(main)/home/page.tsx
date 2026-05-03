import Link from "next/link";
import {
  Headphones,
  Mic2,
  MessageSquare,
  BookOpen,
  Star,
  BookMarked,
  ChevronRight,
  Zap,
  Target,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
}

const features: Feature[] = [
  {
    href: "/dictation",
    icon: Headphones,
    title: "Dictation",
    badge: "Phổ biến nhất",
    badgeColor: "bg-primary/15 text-primary",
    description: "Nghe và gõ lại câu — cách hiệu quả nhất để luyện nghe chính xác từng âm tiết.",
    steps: [
      "Nghe đoạn hội thoại phát ra từ video YouTube thật",
      "Gõ lại câu bạn nghe được vào ô nhập",
      "Kiểm tra kết quả và xem gợi ý chữ cái đầu nếu cần",
      "Click từng từ để reveal nếu không nghe được",
    ],
    tip: "Dùng phím Tab để phát lại, Enter để kiểm tra — không cần rời bàn phím.",
    accentClass: "text-primary",
    borderClass: "border-primary/20 hover:border-primary/50",
  },
  {
    href: "/shadowing",
    icon: Mic2,
    title: "Shadowing",
    description: "Lặp lại từng câu theo người bản ngữ — luyện phát âm, ngữ điệu và tốc độ nói.",
    steps: [
      "Nghe câu và lặp lại giọng nói to",
      "Click từng từ để kiểm tra xem bạn có nhớ không",
      "Nghe lại nếu chưa tự tin, lặp lại đến khi trơn tru",
      "Nhấn Xong để chuyển câu tiếp theo",
    ],
    tip: "Kéo thanh dưới video để điều chỉnh kích thước — xem transcript ở cột bên phải.",
    accentClass: "text-violet-400",
    borderClass: "border-violet-500/20 hover:border-violet-500/50",
  },
  {
    href: "/speaking",
    icon: MessageSquare,
    title: "Luyện nói",
    badge: "AI",
    badgeColor: "bg-emerald-500/15 text-emerald-400",
    description: "Hội thoại trực tiếp với AI — luyện kỹ năng nói tự nhiên trong ngữ cảnh thực.",
    steps: [
      "Chọn chủ đề: phỏng vấn, du lịch, học thuật…",
      "AI đặt câu hỏi và phản hồi như người bản ngữ",
      "Nhận feedback về grammar và vocabulary sau mỗi turn",
      "Luyện liên tục để nâng độ trôi chảy",
    ],
    tip: "Cứ nói tự nhiên — AI sẽ nhẹ nhàng sửa lỗi mà không làm gián đoạn cuộc trò chuyện.",
    accentClass: "text-emerald-400",
    borderClass: "border-emerald-500/20 hover:border-emerald-500/50",
  },
  {
    href: "/vocabulary",
    icon: BookOpen,
    title: "Luyện từ vựng",
    description: "Ôn từ đã lưu bằng Spaced Repetition — hệ thống tự động nhắc đúng lúc bạn sắp quên.",
    steps: [
      "Trong Dictation, lưu từ khó bằng nút Lưu từ",
      "Hệ thống lên lịch ôn dựa trên thuật toán SRS (SM-2)",
      "Mỗi ngày mở Luyện từ vựng để ôn các từ đến hạn",
      "Đánh giá mức nhớ để điều chỉnh khoảng cách ôn",
    ],
    tip: "Chỉ cần 5–10 phút mỗi ngày — SRS giúp bạn nhớ lâu hơn gấp 3 so với học thụ động.",
    accentClass: "text-amber-400",
    borderClass: "border-amber-500/20 hover:border-amber-500/50",
  },
  {
    href: "/my-videos",
    icon: Star,
    title: "Video của tôi",
    badge: "Import",
    badgeColor: "bg-sky-500/15 text-sky-400",
    description: "Import bất kỳ video YouTube nào để luyện — transcript tự động tạo từ phụ đề.",
    steps: [
      "Dán link YouTube vào ô Import video",
      "Hệ thống tự tải transcript và chia thành từng câu",
      "Video xuất hiện trong Dictation và Shadowing",
      "Chọn cấp độ A1–C2 và danh mục phù hợp",
    ],
    tip: "Chọn video có phụ đề chính xác (không auto-generated) để transcript chất lượng hơn.",
    accentClass: "text-sky-400",
    borderClass: "border-sky-500/20 hover:border-sky-500/50",
  },
  {
    href: "/word-lists",
    icon: BookMarked,
    title: "Danh sách từ",
    description: "Xem toàn bộ từ đã lưu, lọc theo video hoặc ngày lưu, xuất ra Anki.",
    steps: [
      "Xem tất cả từ đã lưu trong quá trình luyện tập",
      "Lọc theo video nguồn hoặc khoảng thời gian",
      "Click vào từ để xem ngữ cảnh câu gốc",
      "Xuất danh sách ra Anki để ôn offline",
    ],
    tip: "Lưu từ ngay lúc gặp — não bộ ghi nhớ từ mới tốt nhất khi có ngữ cảnh.",
    accentClass: "text-rose-400",
    borderClass: "border-rose-500/20 hover:border-rose-500/50",
  },
];

const stats = [
  { icon: Target, label: "Phương pháp", value: "Input + Output", color: "text-primary" },
  { icon: Zap, label: "Thời gian đề xuất", value: "30 phút/ngày", color: "text-amber-400" },
  { icon: TrendingUp, label: "Cải thiện sau", value: "4–6 tuần", color: "text-emerald-400" },
  { icon: CheckCircle2, label: "Cấp độ", value: "A1 → C2", color: "text-sky-400" },
];

export default function HomePage() {
  return (
    <div className="flex-1 overflow-y-auto">
      {/* Hero */}
      <div className="px-8 pt-10 pb-8 border-b border-border bg-gradient-to-b from-primary/5 to-transparent">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold tracking-widest text-primary uppercase">BapEnglish</span>
            <span className="text-xs text-muted-foreground">— Luyện IELTS thông minh</span>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3 leading-tight">
            Học tiếng Anh qua<br />
            <span className="text-primary">nội dung thực tế</span>
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-lg">
            Kết hợp Dictation, Shadowing, Spaced Repetition và AI — phương pháp luyện nghe-nói hiệu quả
            nhất được chứng minh bởi khoa học nhận thức.
          </p>
        </div>

        {/* Stats strip */}
        <div className="flex items-center gap-8 mt-6">
          {stats.map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="flex items-center gap-2.5">
              <Icon className={cn("size-4 shrink-0", color)} />
              <div>
                <p className={cn("text-sm font-bold leading-tight", color)}>{value}</p>
                <p className="text-[10px] text-muted-foreground">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feature cards */}
      <div className="px-8 py-8">
        <h2 className="text-sm font-semibold text-muted-foreground tracking-widest uppercase mb-5">
          Các tính năng
        </h2>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {features.map((f) => (
            <Link
              key={f.href}
              href={f.href}
              className={cn(
                "group flex flex-col gap-4 rounded-xl border bg-card p-5 transition-all hover:bg-card/80",
                f.borderClass,
              )}
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn("flex items-center justify-center size-9 rounded-lg bg-white/5 border border-border", f.accentClass)}>
                    <f.icon className="size-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground">{f.title}</span>
                      {f.badge && (
                        <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", f.badgeColor)}>
                          {f.badge}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <ChevronRight className={cn(
                  "size-4 shrink-0 mt-0.5 transition-transform group-hover:translate-x-0.5",
                  f.accentClass,
                )} />
              </div>

              {/* Description */}
              <p className="text-xs text-muted-foreground leading-relaxed">{f.description}</p>

              {/* Steps */}
              <ol className="flex flex-col gap-1.5">
                {f.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                    <span className={cn(
                      "flex items-center justify-center size-4 rounded-full text-[9px] font-bold shrink-0 mt-0.5 bg-white/5",
                      f.accentClass,
                    )}>
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>

              {/* Tip */}
              <div className="rounded-lg bg-white/3 border border-white/5 px-3 py-2">
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  <span className={cn("font-semibold", f.accentClass)}>💡 Tip: </span>
                  {f.tip}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Learning path suggestion */}
      <div className="px-8 pb-10">
        <div className="rounded-xl border border-primary/20 bg-primary/5 px-6 py-5">
          <h3 className="text-sm font-bold text-primary mb-2">Lộ trình đề xuất cho người mới</h3>
          <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
            {[
              "1. Import video yêu thích",
              "2. Luyện Dictation 20 phút",
              "3. Lưu 5–10 từ khó",
              "4. Shadowing câu khó",
              "5. Ôn từ vựng 10 phút",
            ].map((step, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && <ChevronRight className="size-3 text-primary/40" />}
                <span className={i === 0 ? "text-foreground font-medium" : ""}>{step}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
