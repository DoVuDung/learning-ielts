import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { TopNav } from "@/components/top-nav";
import { FlashcardReview } from "./flashcard-review";
import { BookOpen } from "lucide-react";

export default async function VocabularyPage() {
  const session = await getSession();

  const due = session
    ? await prisma.savedWord.findMany({
        where: {
          userId: session.sub,
          nextReview: { lte: new Date() },
        },
        orderBy: { nextReview: "asc" },
      })
    : [];

  return (
    <>
      <TopNav
        title="Luyện từ vựng"
        subtitle={due.length > 0 ? `${due.length} từ cần ôn tập hôm nay` : "Không có từ nào cần ôn"}
      />
      {due.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 text-center px-6">
          <BookOpen className="size-10 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Không có từ nào cần ôn tập hôm nay.</p>
          <p className="text-xs text-muted-foreground">
            Lưu từ trong dictation → ôn tại đây theo hệ thống Spaced Repetition.
          </p>
        </div>
      ) : (
        <FlashcardReview words={due} />
      )}
    </>
  );
}
