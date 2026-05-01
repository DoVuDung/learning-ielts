import { Mic2 } from "lucide-react";
import { TopNav } from "@/components/top-nav";
import { ComingSoon } from "@/components/coming-soon";

export default function ShadowingPage() {
  return (
    <>
      <TopNav title="Luyện Shadowing" subtitle="Nghe và lặp lại để cải thiện phát âm" />
      <ComingSoon
        icon={Mic2}
        title="Shadowing đang được phát triển"
        description="Tính năng luyện shadowing sẽ giúp bạn cải thiện phát âm và ngữ điệu thông qua việc nghe và lặp lại theo người bản ngữ."
      />
    </>
  );
}
