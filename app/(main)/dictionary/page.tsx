import { BookOpen } from "lucide-react";
import { TopNav } from "@/components/top-nav";
import { ComingSoon } from "@/components/coming-soon";

export default function DictionaryPage() {
  return (
    <>
      <TopNav title="Từ điển AI" subtitle="Tra cứu từ vựng thông minh với AI" />
      <ComingSoon
        icon={BookOpen}
        title="Từ điển AI đang được phát triển"
        description="Từ điển AI sẽ cung cấp nghĩa, ví dụ và phát âm chuẩn xác, đồng thời giải thích ngữ cảnh sử dụng từ trong các tình huống thực tế."
      />
    </>
  );
}
