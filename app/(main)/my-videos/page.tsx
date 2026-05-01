import { Star } from "lucide-react";
import { TopNav } from "@/components/top-nav";
import { ComingSoon } from "@/components/coming-soon";

export default function MyVideosPage() {
  return (
    <>
      <TopNav title="Video của tôi" subtitle="Danh sách video bạn đang theo dõi" />
      <ComingSoon
        icon={Star}
        title="Chưa có video nào được lưu"
        description="Khi bạn đánh dấu yêu thích một video dictation, nó sẽ xuất hiện ở đây để bạn dễ dàng quay lại luyện tập."
      />
    </>
  );
}
