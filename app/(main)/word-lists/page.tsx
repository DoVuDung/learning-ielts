import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { TopNav } from "@/components/top-nav";
import { WordListClient } from "./word-list-client";

export default async function WordListsPage() {
  const session = await getSession();

  const words = session
    ? await prisma.savedWord.findMany({
        where: { userId: session.sub },
        orderBy: { createdAt: "desc" },
      })
    : [];

  return (
    <>
      <TopNav
        title="Danh sách từ"
        subtitle={`${words.length} từ đã lưu`}
      />
      <WordListClient initialWords={words} />
    </>
  );
}
