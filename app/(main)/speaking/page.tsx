import { TopNav } from "@/components/top-nav";
import { SpeakingChat } from "./speaking-chat";

export default function SpeakingPage() {
  return (
    <>
      <TopNav title="Luyện nói" subtitle="Thực hành hội thoại tiếng Anh với AI" />
      <SpeakingChat />
    </>
  );
}
