import { BookOpen } from "lucide-react";
import { TopNav } from "@/components/top-nav";
import { ComingSoon } from "@/components/coming-soon";

export default function VocabularyPage() {
  return (
    <>
      <TopNav title="Luyện từ vựng" subtitle="Học từ vựng qua thẻ ghi nhớ thông minh" />
      <ComingSoon
        icon={BookOpen}
        title="Luyện từ vựng đang được phát triển"
        description="Tính năng luyện từ vựng sẽ sử dụng phương pháp Spaced Repetition giúp bạn ghi nhớ từ vựng hiệu quả và lâu dài."
      />
    </>
  );
}
