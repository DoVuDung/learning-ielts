import { TopNav } from "@/components/top-nav";
import { DictionaryClient } from "./dictionary-client";

export default function DictionaryPage() {
  return (
    <>
      <TopNav
        title="Từ điển AI & IELTS"
        subtitle="Tra cứu định nghĩa song ngữ, phát âm chuẩn và lưu vào Flashcard FSRS"
        showSearch
      />
      <main className="flex-1 overflow-y-auto px-6 py-8">
        <DictionaryClient />
      </main>
    </>
  );
}
