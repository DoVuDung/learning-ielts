import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { TopNav } from "@/components/top-nav";
import { WordListClient } from "./word-list-client";

export default async function WordListsPage() {
  const session = await getSession();

  const notes = session
    ? await prisma.note.findMany({
        where: { userId: session.sub },
        orderBy: { createdAt: "desc" },
        include: { cards: true },
      })
    : [];

  return (
    <>
      <TopNav title="Danh sách từ" subtitle={`${notes.length} từ đã lưu`} />
      <WordListClient initialNotes={notes} />
    </>
  );
}
