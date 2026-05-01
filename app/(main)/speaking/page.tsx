import { MessageSquare } from "lucide-react";
import { TopNav } from "@/components/top-nav";
import { ComingSoon } from "@/components/coming-soon";

export default function SpeakingPage() {
  return (
    <>
      <TopNav title="Luyện nói" subtitle="Thực hành hội thoại tự nhiên với AI" />
      <ComingSoon
        icon={MessageSquare}
        title="Luyện nói đang được phát triển"
        description="Tính năng luyện nói sẽ cho phép bạn thực hành hội thoại tiếng Anh tự nhiên với AI, nhận phản hồi theo thời gian thực về phát âm và ngữ pháp."
      />
    </>
  );
}
