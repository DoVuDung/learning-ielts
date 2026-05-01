import { BookMarked } from "lucide-react";
import { TopNav } from "@/components/top-nav";
import { ComingSoon } from "@/components/coming-soon";

export default function WordListsPage() {
  return (
    <>
      <TopNav title="Danh sách từ" subtitle="Quản lý danh sách từ vựng của bạn" />
      <ComingSoon
        icon={BookMarked}
        title="Danh sách từ đang trống"
        description="Trong quá trình luyện dictation, bạn có thể lưu những từ mới vào đây để ôn tập sau. Danh sách của bạn sẽ hiển thị tại đây."
      />
    </>
  );
}
