import { TrendingUp } from "lucide-react";
import { TopNav } from "@/components/top-nav";
import { ComingSoon } from "@/components/coming-soon";

export default function StatsPage() {
  return (
    <>
      <TopNav title="Thống kê" subtitle="Theo dõi tiến trình học tập của bạn" />
      <ComingSoon
        icon={TrendingUp}
        title="Thống kê đang được phát triển"
        description="Trang thống kê sẽ hiển thị biểu đồ tiến trình học tập, số giờ luyện tập, độ chính xác dictation và xu hướng cải thiện theo thời gian."
      />
    </>
  );
}
