import { BarChart2 } from "lucide-react";
import { TopNav } from "@/components/top-nav";
import { ComingSoon } from "@/components/coming-soon";

export default function LeaderboardPage() {
  return (
    <>
      <TopNav title="Xếp hạng" subtitle="Bảng xếp hạng người học toàn cầu" />
      <ComingSoon
        icon={BarChart2}
        title="Bảng xếp hạng đang được phát triển"
        description="Tính năng xếp hạng sẽ cho phép bạn so sánh tiến độ học tập với những người dùng khác và cạnh tranh để leo hạng mỗi tuần."
      />
    </>
  );
}
