import { TopNav } from "@/components/top-nav";
import { FilterBar } from "@/components/filter-bar";
import { LessonGrid } from "@/components/lesson-grid";
import type { VideoCardProps } from "@/components/video-card";

const newLessons: VideoCardProps[] = [
  {
    title: "Will laser blasters ever be possible? – Christopher Barnett",
    thumbnail: "https://i.ytimg.com/vi/TRL7o2kPqw0/hqdefault.jpg",
    duration: "6 min",
    segments: 71,
    level: "C1",
    isNew: true,
  },
  {
    title: "What Earth in 2125 could look like – Iseult Gillespie",
    thumbnail: "https://i.ytimg.com/vi/cT_GMAO8pDk/hqdefault.jpg",
    duration: "5 min",
    segments: 73,
    level: "C1",
    isNew: true,
  },
  {
    title: "The surprising way we can cool the planet – Elise Cutts",
    thumbnail: "https://i.ytimg.com/vi/MQ3xD1f8Kl8/hqdefault.jpg",
    duration: "5 min",
    segments: 61,
    level: "C1",
    isNew: true,
  },
  {
    title: "The solution to our energy problems is … a toaster?",
    thumbnail: "https://i.ytimg.com/vi/GHVy5tSvpOU/hqdefault.jpg",
    duration: "4 min",
    segments: 53,
    level: "C1",
    isNew: true,
  },
  {
    title: "Have we reached the limit of computer power? – Vijay Donepudi",
    thumbnail: "https://i.ytimg.com/vi/nKW8Ndu7Mjw/hqdefault.jpg",
    duration: "5 min",
    segments: 58,
    level: "C1",
    isNew: true,
  },
];

const bbcLessons: VideoCardProps[] = [
  {
    title: "The future of food 🍎 6 Minute English",
    thumbnail: "https://i.ytimg.com/vi/VJFKiKqHnig/hqdefault.jpg",
    duration: "6 phút",
    segments: 48,
    level: "B1",
  },
  {
    title: "Keeping kids off smartphones 📵 6 Minute English",
    thumbnail: "https://i.ytimg.com/vi/ZdgrrlvjKy0/hqdefault.jpg",
    duration: "6 phút",
    segments: 52,
    level: "B2",
  },
  {
    title: "Learning a new food culture 🍜 6 Minute English",
    thumbnail: "https://i.ytimg.com/vi/xWI0LoZ5Mws/hqdefault.jpg",
    duration: "6 phút",
    segments: 49,
    level: "B2",
  },
  {
    title: "What decides our taste? 🤔 6 Minute English",
    thumbnail: "https://i.ytimg.com/vi/N2cU9oG1pkA/hqdefault.jpg",
    duration: "6 phút",
    segments: 50,
    level: "B2",
  },
  {
    title: "Did Taylor Swift fans cause an earthquake? 🎶 6 Minute English",
    thumbnail: "https://i.ytimg.com/vi/Kz4M6hVm_WA/hqdefault.jpg",
    duration: "6 phút",
    segments: 55,
    level: "B2",
  },
];

const ieltsLessons: VideoCardProps[] = [
  {
    title: "IELTS Listening Practice – Academic Test 1",
    thumbnail: "https://i.ytimg.com/vi/sPM1PBk8_Ks/hqdefault.jpg",
    duration: "30 min",
    segments: 120,
    level: "C1",
  },
  {
    title: "IELTS Speaking – Describe a place you visited",
    thumbnail: "https://i.ytimg.com/vi/tMqT-VIAqlI/hqdefault.jpg",
    duration: "8 min",
    segments: 40,
    level: "B2",
  },
  {
    title: "IELTS Writing Task 2 – Environment essay",
    thumbnail: "https://i.ytimg.com/vi/HumMYM5EGII/hqdefault.jpg",
    duration: "12 min",
    segments: 60,
    level: "C1",
  },
  {
    title: "IELTS Reading Strategies – True/False/Not Given",
    thumbnail: "https://i.ytimg.com/vi/wW3nePfFVlQ/hqdefault.jpg",
    duration: "15 min",
    segments: 75,
    level: "B2",
  },
];

export default function DictationPage() {
  return (
    <>
      <TopNav
        title="Luyện Dictation"
        subtitle="Chọn chủ đề để luyện kỹ năng nghe"
        showStats
      />
      <main className="flex-1 overflow-y-auto px-6 py-6">
        <FilterBar />
        <div className="flex flex-col gap-10 mt-6">
          <LessonGrid title="Bài học mới" lessons={newLessons} />
          <LessonGrid
            title="BBC Learning English"
            count={41}
            href="/category/bbc"
            lessons={bbcLessons}
          />
          <LessonGrid
            title="IELTS"
            count={256}
            href="/category/ielts"
            lessons={ieltsLessons}
          />
        </div>
      </main>
    </>
  );
}
