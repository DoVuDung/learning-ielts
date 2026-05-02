import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { TopNav } from "@/components/top-nav";
import { CheckCircle2, BookOpen, TrendingUp, Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default async function StatsPage() {
  const session = await getSession();

  const progress = session
    ? await prisma.dictationProgress.findMany({
        where: { userId: session.sub },
        include: { video: { select: { title: true, level: true } } },
        orderBy: { updatedAt: "desc" },
      })
    : [];

  const totalSentencesDone = progress.reduce((s, p) => s + p.sentencesDone, 0);
  const completed = progress.filter((p) => p.completedAt !== null).length;
  const avgPct =
    progress.length > 0
      ? Math.round(
          (progress.reduce(
            (s, p) => s + (p.totalSentences > 0 ? p.sentencesDone / p.totalSentences : 0),
            0
          ) /
            progress.length) *
            100
        )
      : 0;

  const stats = [
    { icon: BookOpen, label: "Đang học", value: progress.length - completed, color: "text-blue-400" },
    { icon: CheckCircle2, label: "Đã hoàn thành", value: completed, color: "text-emerald-400" },
    { icon: TrendingUp, label: "Câu đã luyện", value: totalSentencesDone, color: "text-violet-400" },
    { icon: Trophy, label: "Trung bình", value: `${avgPct}%`, color: "text-amber-400" },
  ];

  return (
    <>
      <TopNav title="Thống kê" subtitle="Theo dõi tiến trình luyện tập của bạn" />
      <main className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
              <Icon className={`size-5 ${color}`} />
              <div>
                <p className={`text-2xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
              </div>
            </div>
          ))}
        </div>

        {progress.length > 0 ? (
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
        ) : (
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
