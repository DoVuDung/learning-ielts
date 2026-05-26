import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { TopNav } from "@/components/top-nav";
import { FlashcardReview } from "./flashcard-review";
import { BookOpen } from "lucide-react";

const NEW_PER_DAY = 20;
const REVIEW_PER_DAY = 200;

export default async function VocabularyPage() {
  const session = await getSession();

  if (!session) {
    return (
      <>
        <TopNav title="Luyện từ vựng" subtitle="Cần đăng nhập" />
        <div className="flex-1 flex items-center justify-center text-sm text-muted-foreground">
          Đăng nhập để bắt đầu ôn tập.
        </div>
      </>
    );
  }

  const now = new Date();

  const [dueReviews, newCards] = await Promise.all([
    prisma.card.findMany({
      where: {
        userId: session.sub,
        state: { in: ["LEARNING", "REVIEW", "RELEARNING"] },
        due: { lte: now },
      },
      orderBy: { due: "asc" },
      take: REVIEW_PER_DAY,
      include: { note: true },
    }),
    prisma.card.findMany({
      where: { userId: session.sub, state: "NEW" },
      orderBy: { createdAt: "asc" },
      take: NEW_PER_DAY,
      include: { note: true },
    }),
  ]);

  const queue = [...dueReviews, ...newCards];

  return (
    <>
      <TopNav
        title="Luyện từ vựng"
        subtitle={
          queue.length > 0
            ? `${dueReviews.length} ôn tập · ${newCards.length} từ mới`
            : "Không có thẻ nào cần ôn"
        }
      />
      {queue.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
          <BookOpen className="size-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Không có thẻ nào cần ôn hôm nay.</p>
          <p className="text-xs text-muted-foreground">
            Lưu từ trong dictation → ôn tại đây theo lịch FSRS.
          </p>
        </div>
      ) : (
        <FlashcardReview cards={queue} />
      )}
    </>
  );
}
