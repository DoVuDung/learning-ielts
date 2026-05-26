import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { TopNav } from "@/components/top-nav";
import {
  CheckCircle2, BookOpen, TrendingUp, Trophy,
  Headphones, PenLine, BookMarked, Mic,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { skillLevel } from "@/lib/skill-level";

export default async function StatsPage() {
  const session = await getSession();
  if (!session) {
    return (
      <>
        <TopNav title="Thống kê" subtitle="Cần đăng nhập" />
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
          Đăng nhập để xem thống kê.
        </div>
      </>
    );
  }

  const [progress, notes, cards] = await Promise.all([
    prisma.dictationProgress.findMany({
      where: { userId: session.sub },
      include: { video: { select: { title: true, level: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.note.count({ where: { userId: session.sub } }),
    prisma.card.findMany({
      where: { userId: session.sub },
      select: { state: true, reps: true, lapses: true },
    }),
  ]);

  const totalSentencesDone = progress.reduce((s, p) => s + p.sentencesDone, 0);
  const completed = progress.filter((p) => p.completedAt !== null).length;
  const totalReviews = cards.reduce((s, c) => s + c.reps, 0);
  const masteredCards = cards.filter((c) => c.state === "REVIEW" && c.reps >= 3).length;
  const avgPct =
    progress.length > 0
      ? Math.round(
          (progress.reduce(
            (s, p) => s + (p.totalSentences > 0 ? p.sentencesDone / p.totalSentences : 0),
            0,
          ) /
            progress.length) *
            100,
        )
      : 0;

  // Skill scores (proxy metrics)
  const listeningScore = totalSentencesDone;            // dictation sentences
  const readingScore   = Math.round(totalSentencesDone * 0.4 + notes * 2); // reading transcripts + vocab
  const writingScore   = Math.round(totalSentencesDone * 0.6);             // typed output in dictation
  const speakingScore  = 0; // future: track speaking sessions

  const skills = [
    { icon: Headphones, label: "Listening",  score: listeningScore },
    { icon: PenLine,    label: "Writing",    score: writingScore   },
    { icon: BookMarked, label: "Reading",    score: readingScore   },
    { icon: Mic,        label: "Speaking",   score: speakingScore  },
  ];

  const overviewStats = [
    { icon: BookOpen,    label: "Video đang học",    value: progress.length - completed, color: "text-blue-400"    },
    { icon: CheckCircle2,label: "Video hoàn thành",  value: completed,                   color: "text-emerald-400" },
    { icon: TrendingUp,  label: "Câu đã luyện",       value: totalSentencesDone,          color: "text-violet-400"  },
    { icon: Trophy,      label: "Từ đã học",           value: notes,                       color: "text-amber-400"   },
  ];

  return (
    <>
      <TopNav title="Thống kê" subtitle="Theo dõi tiến trình luyện tập của bạn" />
      <main className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-8">

        {/* Overview cards */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {overviewStats.map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
              <Icon className={`size-5 ${color}`} />
              <div>
                <p className={`text-2xl font-bold ${color}`}>
                  {typeof value === "number" ? value.toLocaleString() : value}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Vocabulary stats */}
        <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-foreground">Từ vựng</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-amber-400">{notes.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Từ đã lưu</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-emerald-400">{masteredCards.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Thẻ đã thuộc</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-sky-400">{totalReviews.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground mt-0.5">Lượt ôn tập</p>
            </div>
          </div>
        </div>

        {/* Skill levels */}
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold text-foreground">Trình độ kỹ năng</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {skills.map(({ icon: Icon, label, score }) => {
              const lvl = skillLevel(score);
              return (
                <div key={label} className="rounded-xl border border-border bg-card p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="size-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{label}</span>
                    </div>
                    <span className={`text-xs font-semibold ${lvl.color}`}>{lvl.label}</span>
                  </div>
                  <Progress value={lvl.pct} className="h-1.5" />
                  <p className="text-[11px] text-muted-foreground">
                    {score.toLocaleString()} điểm
                    {label === "Speaking" && " · Tính năng đang phát triển"}
                  </p>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground px-1">
            Trình độ được ước tính dựa trên hoạt động luyện tập. Listening và Writing dựa trên dictation, Reading dựa trên transcript và từ vựng.
          </p>
        </div>

        {/* Video progress detail */}
        {progress.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="text-sm font-semibold text-foreground">Chi tiết từng video</h2>
            <div className="flex flex-col gap-2">
              {progress.map((p) => {
                const pct =
                  p.totalSentences > 0
                    ? Math.round((p.sentencesDone / p.totalSentences) * 100)
                    : 0;
                return (
                  <div
                    key={p.id}
                    className="flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3"
                  >
                    <div className="flex flex-col flex-1 min-w-0 gap-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium truncate">{p.video.title}</p>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {p.sentencesDone}/{p.totalSentences}
                        </span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                    <span
                      className={`text-sm font-bold shrink-0 ${pct === 100 ? "text-emerald-400" : "text-primary"}`}
                    >
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {progress.length === 0 && notes === 0 && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
            <TrendingUp className="size-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Chưa có dữ liệu luyện tập.</p>
            <p className="text-xs text-muted-foreground">
              Hoàn thành bài dictation đầu tiên để xem thống kê.
            </p>
          </div>
        )}
      </main>
    </>
  );
}
