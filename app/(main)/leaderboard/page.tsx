import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { TopNav } from "@/components/top-nav";
import { Trophy, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { rankUsers } from "@/lib/leaderboard";

export const dynamic = "force-dynamic";
export const revalidate = 60; // refresh leaderboard every minute

async function getRanked() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        progress: { select: { sentencesDone: true } },
        cards: { select: { reps: true } },
        notes: { select: { id: true } },
      },
    });

    return rankUsers(
      users.map((u) => ({
        id: u.id,
        name: u.name,
        avatarUrl: u.avatarUrl,
        sentencesDone: u.progress.reduce((s, p) => s + p.sentencesDone, 0),
        reviewsDone: u.cards.reduce((s, c) => s + c.reps, 0),
        wordsSaved: u.notes.length,
      })),
    );
  } catch {
    return [];
  }
}

const RANK_STYLES = [
  "text-amber-400 bg-amber-400/10 border-amber-400/30",   // 1st
  "text-slate-300 bg-slate-300/10 border-slate-300/30",   // 2nd
  "text-amber-600 bg-amber-600/10 border-amber-600/30",   // 3rd
];

const SCORE_STYLES = [
  "text-amber-400",
  "text-slate-300",
  "text-amber-600",
];

export default async function LeaderboardPage() {
  const session = await getSession();
  const ranked = await getRanked();
  const myRank = ranked.findIndex((u) => u.id === session?.sub) + 1;

  return (
    <>
      <TopNav
        title="Xếp hạng"
        subtitle={
          ranked.length > 0
            ? `${ranked.length} người học · ${myRank > 0 ? `Hạng của bạn: #${myRank}` : "Bắt đầu học để xếp hạng"}`
            : "Bảng xếp hạng người học"
        }
      />

      <main className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-4 max-w-2xl mx-auto w-full">
        {/* Score legend */}
        <div className="flex items-center gap-4 text-[11px] text-muted-foreground bg-card border border-border rounded-xl px-4 py-2.5">
          <span className="font-medium text-foreground">Cách tính điểm:</span>
          <span>1 câu dictation = 1đ</span>
          <span>1 lượt ôn thẻ = 2đ</span>
          <span>1 từ đã lưu = 1đ</span>
        </div>

        {ranked.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 text-center py-20">
            <Users className="size-10 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">Chưa có người học nào.</p>
            <p className="text-xs text-muted-foreground">
              Hoàn thành bài dictation đầu tiên để xuất hiện tại đây.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {ranked.map((user, i) => {
              const rank = i + 1;
              const isMe = user.id === session?.sub;
              const rankStyle = RANK_STYLES[i] ?? "text-muted-foreground bg-white/5 border-border";
              const scoreStyle = SCORE_STYLES[i] ?? "text-foreground";

              return (
                <div
                  key={user.id}
                  className={cn(
                    "flex items-center gap-4 rounded-xl border px-4 py-3 transition-colors",
                    isMe
                      ? "border-primary/40 bg-primary/5"
                      : "border-border bg-card",
                  )}
                >
                  {/* Rank */}
                  <div
                    className={cn(
                      "size-8 rounded-full border flex items-center justify-center shrink-0 font-bold",
                      rankStyle,
                    )}
                  >
                    {rank <= 3 ? (
                      <Trophy className="size-3.5" />
                    ) : (
                      <span className="text-xs">{rank}</span>
                    )}
                  </div>

                  {/* Avatar */}
                  <div className="size-9 rounded-full bg-primary/20 overflow-hidden shrink-0 border border-border">
                    {user.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="size-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="size-full flex items-center justify-center text-sm font-bold text-primary">
                        {user.name[0].toUpperCase()}
                      </div>
                    )}
                  </div>

                  {/* Name + breakdown */}
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-semibold truncate", isMe && "text-primary")}>
                      {user.name}
                      {isMe && (
                        <span className="ml-1.5 text-[10px] font-medium text-primary/70 uppercase tracking-wider">
                          Bạn
                        </span>
                      )}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      {user.sentencesDone.toLocaleString()} câu ·{" "}
                      {user.reviewsDone.toLocaleString()} ôn ·{" "}
                      {user.wordsSaved.toLocaleString()} từ
                    </p>
                  </div>

                  {/* Score */}
                  <div className="text-right shrink-0">
                    <p className={cn("text-xl font-bold tabular-nums", scoreStyle)}>
                      {user.score.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      điểm
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
