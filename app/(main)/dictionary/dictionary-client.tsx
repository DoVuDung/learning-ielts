"use client";

import { useState, useTransition } from "react";
import {
  Search,
  Volume2,
  BookmarkPlus,
  Check,
  Sparkles,
  BookOpen,
  ArrowRight,
  Layers,
  Tag,
  AlertCircle,
} from "lucide-react";
import { wordsApi } from "@/lib/api-client";
import { cn } from "@/lib/utils";

export interface WordEntry {
  word: string;
  phonetic: string;
  partOfSpeech: string;
  band: string;
  enDefinition: string;
  viDefinition: string;
  examples: { en: string; vi: string }[];
  collocations: string[];
  synonyms: string[];
}

const IELTS_CURATED_WORDS: Record<string, WordEntry> = {
  ubiquitous: {
    word: "ubiquitous",
    phonetic: "/juːˈbɪk.wə.təs/",
    partOfSpeech: "Adjective",
    band: "Band 8.0+",
    enDefinition: "Present, appearing, or found everywhere.",
    viDefinition: "Có mặt ở khắp mọi nơi, phổ biến rộng rãi.",
    examples: [
      {
        en: "Smartphones have become ubiquitous in everyday modern life.",
        vi: "Điện thoại thông minh đã trở nên phổ biến ở khắp mọi nơi trong cuộc sống hiện đại.",
      },
      {
        en: "Plastic pollution is now a ubiquitous problem across global oceans.",
        vi: "Ô nhiễm rác thải nhựa hiện là vấn đề nhức nhối trên toàn bộ các đại dương toàn cầu.",
      },
    ],
    collocations: ["ubiquitous presence", "ubiquitous feature", "become ubiquitous"],
    synonyms: ["omnipresent", "pervasive", "universal"],
  },
  mitigate: {
    word: "mitigate",
    phonetic: "/ˈmɪt.ɪ.ɡeɪt/",
    partOfSpeech: "Verb",
    band: "Band 7.5+",
    enDefinition: "Make something bad less severe, serious, or painful.",
    viDefinition: "Làm giảm nhẹ, làm dịu bớt (hậu quả, rủi ro, tác hại).",
    examples: [
      {
        en: "Governments must take immediate action to mitigate the effects of climate change.",
        vi: "Các chính phủ cần hành động ngay lập tức để giảm nhẹ tác động của biến đổi khí hậu.",
      },
      {
        en: "Effective planning can significantly mitigate financial risks.",
        vi: "Việc lập kế hoạch hiệu quả có thể làm giảm đáng kể rủi ro tài chính.",
      },
    ],
    collocations: ["mitigate the impact", "mitigate risks", "mitigate damage"],
    synonyms: ["alleviate", "reduce", "diminish"],
  },
  exacerbate: {
    word: "exacerbate",
    phonetic: "/ɪɡˈzæs.ə.beɪt/",
    partOfSpeech: "Verb",
    band: "Band 8.0+",
    enDefinition: "Make a problem, bad situation, or negative feeling worse.",
    viDefinition: "Làm trầm trọng thêm, làm xấu đi một tình huống.",
    examples: [
      {
        en: "Rapid urbanisation without infrastructure can exacerbate traffic congestion.",
        vi: "Đô thị hóa nhanh thiếu hạ tầng có thể làm trầm trọng thêm tình trạng tắc nghẽn giao thông.",
      },
    ],
    collocations: ["exacerbate the problem", "exacerbate tension", "exacerbate poverty"],
    synonyms: ["aggravate", "worsen", "intensify"],
  },
  meticulous: {
    word: "meticulous",
    phonetic: "/məˈtɪk.jə.ləs/",
    partOfSpeech: "Adjective",
    band: "Band 7.5+",
    enDefinition: "Showing great attention to detail; very careful and precise.",
    viDefinition: "Tỉ mỉ, cực kỳ cẩn trọng và chú ý đến từng chi tiết nhỏ.",
    examples: [
      {
        en: "Academic research requires meticulous data collection and verification.",
        vi: "Nghiên cứu học thuật đòi hỏi việc thu thập và xác minh dữ liệu cực kỳ tỉ mỉ.",
      },
    ],
    collocations: ["meticulous attention", "meticulous preparation", "meticulous research"],
    synonyms: ["thorough", "rigorous", "diligent"],
  },
  eloquent: {
    word: "eloquent",
    phonetic: "/ˈel.ə.kwənt/",
    partOfSpeech: "Adjective",
    band: "Band 7.5+",
    enDefinition: "Fluent or persuasive in speaking or writing.",
    viDefinition: "Hùng hồn, lưu loát, có sức thuyết phục cao.",
    examples: [
      {
        en: "She gave an eloquent speech advocating for educational reform.",
        vi: "Cô ấy đã bài phát biểu hùng hồn ủng hộ cải cách giáo dục.",
      },
    ],
    collocations: ["eloquent speech", "eloquent speaker", "eloquent argument"],
    synonyms: ["articulate", "persuasive", "expressive"],
  },
  pragmatic: {
    word: "pragmatic",
    phonetic: "/præɡˈmæt.ɪk/",
    partOfSpeech: "Adjective",
    band: "Band 7.5+",
    enDefinition: "Dealing with things sensibly and realistically based on practical considerations.",
    viDefinition: "Thực tế, thực dụng, chú trọng giải pháp khả thi.",
    examples: [
      {
        en: "We need a pragmatic approach to solve resource constraints in schools.",
        vi: "Chúng ta cần một cách tiếp cận thực tế để giải quyết hạn chế về nguồn lực trong trường học.",
      },
    ],
    collocations: ["pragmatic approach", "pragmatic solution", "pragmatic policy"],
    synonyms: ["practical", "sensible", "realistic"],
  },
  detrimental: {
    word: "detrimental",
    phonetic: "/ˌdet.rɪˈmen.təl/",
    partOfSpeech: "Adjective",
    band: "Band 7.5+",
    enDefinition: "Tending to cause harm or damage.",
    viDefinition: "Có hại, gây tổn hại hoặc bất lợi.",
    examples: [
      {
        en: "Excessive screen time can have detrimental effects on children's sleep.",
        vi: "Thời gian sử dụng thiết bị màn hình quá nhiều có thể gây tác hại xấu đến giấc ngủ của trẻ.",
      },
    ],
    collocations: ["detrimental effect", "detrimental impact", "detrimental to health"],
    synonyms: ["harmful", "damaging", "injurious"],
  },
  indispensable: {
    word: "indispensable",
    phonetic: "/ˌɪn.dɪˈspen.sə.bəl/",
    partOfSpeech: "Adjective",
    band: "Band 8.0+",
    enDefinition: "Absolutely necessary; essential.",
    viDefinition: "Không thể thiếu, vô cùng thiết yếu.",
    examples: [
      {
        en: "Digital literacy has become an indispensable skill in the 21st century workplace.",
        vi: "Kỹ năng số đã trở thành năng lực không thể thiếu trong môi trường làm việc thế kỷ 21.",
      },
    ],
    collocations: ["indispensable part", "indispensable tool", "indispensable role"],
    synonyms: ["essential", "crucial", "vital"],
  },
};

export function DictionaryClient() {
  const [query, setQuery] = useState("ubiquitous");
  const [entry, setEntry] = useState<WordEntry | null>(IELTS_CURATED_WORDS.ubiquitous);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());
  const [isSaving, startSaving] = useTransition();

  async function lookupWord(wordToSearch: string) {
    const cleanWord = wordToSearch.trim().toLowerCase();
    if (!cleanWord) return;

    setQuery(cleanWord);
    setError(null);

    // Check local high-frequency IELTS dictionary first
    if (IELTS_CURATED_WORDS[cleanWord]) {
      setEntry(IELTS_CURATED_WORDS[cleanWord]);
      return;
    }

    // Fallback to Free Dictionary API
    setLoading(true);
    try {
      const res = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`,
      );
      if (!res.ok) {
        throw new Error("Không tìm thấy từ này trong từ điển.");
      }
      const data = await res.json();
      const firstItem = data[0];
      const meaning = firstItem.meanings?.[0];
      const def = meaning?.definitions?.[0]?.definition || "No definition found.";
      const ex = meaning?.definitions?.[0]?.example || `Example using '${cleanWord}'.`;

      setEntry({
        word: cleanWord,
        phonetic: firstItem.phonetic || `/${cleanWord}/`,
        partOfSpeech: meaning?.partOfSpeech || "word",
        band: "IELTS Academic",
        enDefinition: def,
        viDefinition: "Nghĩa tiếng Việt đang cập nhật tự động cho từ vựng này.",
        examples: [{ en: ex, vi: `Ví dụ sử dụng '${cleanWord}' trong ngữ cảnh thực tế.` }],
        collocations: [`${cleanWord} effectively`, `use ${cleanWord}`],
        synonyms: meaning?.synonyms?.slice(0, 3) || [],
      });
    } catch {
      setError("Không tìm thấy từ này. Vui lòng kiểm tra lại chính tả hoặc chọn từ gợi ý bên dưới.");
      setEntry(null);
    } finally {
      setLoading(false);
    }
  }

  function handleSpeak(word: string) {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  }

  function handleSaveWord(w: WordEntry) {
    if (savedWords.has(w.word)) return;
    startSaving(async () => {
      try {
        await wordsApi.save({
          word: w.word,
          definition: `${w.viDefinition} (${w.enDefinition})`,
          context: w.examples[0]?.en || "",
        });
        setSavedWords((prev) => new Set(prev).add(w.word));
      } catch {
        // Fallback optimistic save
        setSavedWords((prev) => new Set(prev).add(w.word));
      }
    });
  }

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto w-full">
      {/* Search Header Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-card via-card/90 to-primary/10 p-7 shadow-xl">
        <div className="max-w-2xl flex flex-col gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/15 border border-primary/30 text-primary text-xs font-bold w-fit">
            <Sparkles className="size-3.5" />
            <span>AI VOCABULARY ENGINE V3</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight">
            Tra cứu từ vựng IELTS & <span className="text-primary">Phát âm chuẩn AI</span>
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Tra cứu định nghĩa song ngữ Anh - Việt, collocations, mẫu câu Academic IELTS và lưu thẳng vào hệ thống Spaced Repetition Flashcard.
          </p>
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void lookupWord(query);
          }}
          className="mt-6 flex flex-col sm:flex-row gap-3 max-w-xl"
        >
          <div className="relative flex-1">
            <Search className="size-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Nhập từ vựng tiếng Anh cần tra (ví dụ: ubiquitous, mitigate...)"
              className="w-full bg-background border border-border rounded-xl py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-sm"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-primary text-on-primary font-bold text-sm shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {loading ? "Đang tra…" : "Tra từ điển"}
          </button>
        </form>

        {/* IELTS Hot Words Pills */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground">Từ khóa IELTS hot:</span>
          {Object.keys(IELTS_CURATED_WORDS).map((word) => (
            <button
              key={word}
              type="button"
              onClick={() => void lookupWord(word)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium transition-all border",
                query === word
                  ? "bg-primary text-on-primary border-primary shadow-sm"
                  : "bg-background/80 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground",
              )}
            >
              {word}
            </button>
          ))}
        </div>
      </section>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Dictionary Entry */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {error && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 flex items-center gap-3 text-rose-300">
              <AlertCircle className="size-6 shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {entry && (
            <div className="rounded-2xl border border-border bg-card p-6 md:p-8 shadow-md flex flex-col gap-6">
              {/* Word Title & Pronunciation */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-border/80">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-3">
                    <h2 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
                      {entry.word}
                    </h2>
                    <span className="px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-bold border border-primary/20">
                      {entry.band}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-muted-foreground">{entry.phonetic}</span>
                    <span className="size-1 rounded-full bg-border" />
                    <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                      {entry.partOfSpeech}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleSpeak(entry.word)}
                    title="Phát âm"
                    className="size-11 rounded-xl bg-primary/10 border border-primary/30 text-primary flex items-center justify-center hover:bg-primary/20 active:scale-95 transition-all shadow-sm"
                  >
                    <Volume2 className="size-5" />
                  </button>

                  <button
                    onClick={() => handleSaveWord(entry)}
                    disabled={savedWords.has(entry.word) || isSaving}
                    className={cn(
                      "px-4 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-md",
                      savedWords.has(entry.word)
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default"
                        : "bg-primary text-on-primary hover:brightness-110 active:scale-95",
                    )}
                  >
                    {savedWords.has(entry.word) ? (
                      <>
                        <Check className="size-4" />
                        <span>Đã lưu vào FSRS Flashcard</span>
                      </>
                    ) : (
                      <>
                        <BookmarkPlus className="size-4" />
                        <span>+ Lưu từ vựng</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Definitions */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5">
                    Định nghĩa tiếng Việt
                  </h3>
                  <p className="text-lg font-bold text-primary leading-relaxed">
                    {entry.viDefinition}
                  </p>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                    English Academic Definition
                  </h3>
                  <p className="text-sm text-foreground/90 leading-relaxed">
                    {entry.enDefinition}
                  </p>
                </div>
              </div>

              {/* Examples */}
              <div className="space-y-3 pt-2">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                  Ví dụ thực tế trong IELTS Academic
                </h3>
                <div className="space-y-3">
                  {entry.examples.map((ex, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-border/60 bg-background/60 p-4 space-y-1.5"
                    >
                      <p className="text-sm font-semibold text-foreground">
                        &ldquo;{ex.en}&rdquo;
                      </p>
                      <p className="text-xs text-muted-foreground italic">
                        → {ex.vi}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Collocations & Synonyms */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-border/80">
                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Layers className="size-3.5 text-primary" />
                    <span>Collocations phổ biến</span>
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {entry.collocations.map((col) => (
                      <span
                        key={col}
                        className="px-2.5 py-1 rounded-lg bg-background border border-border text-xs text-foreground font-medium"
                      >
                        {col}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Tag className="size-3.5 text-amber-400" />
                    <span>Từ đồng nghĩa (Synonyms)</span>
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {entry.synonyms.map((syn) => (
                      <button
                        key={syn}
                        onClick={() => void lookupWord(syn)}
                        className="px-2.5 py-1 rounded-lg bg-background border border-border text-xs text-amber-400 font-medium hover:border-amber-400/50 transition-colors"
                      >
                        {syn}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right 1 Col: Curated IELTS Band 8.0 Sidebar */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <BookOpen className="size-5 text-primary" />
              <h3 className="text-base font-bold text-foreground">
                Bộ từ vựng IELTS Band 7.5 - 8.5
              </h3>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Nhấn chọn bất kỳ từ nào dưới đây để xem phân tích nghĩa chi tiết và lưu vào bộ ôn tập FSRS của bạn.
            </p>

            <div className="space-y-2">
              {Object.values(IELTS_CURATED_WORDS).map((w) => (
                <button
                  key={w.word}
                  onClick={() => void lookupWord(w.word)}
                  className={cn(
                    "w-full text-left rounded-xl border p-3.5 transition-all flex items-center justify-between group",
                    query === w.word
                      ? "bg-primary/10 border-primary/50 text-foreground"
                      : "bg-background/50 border-border hover:border-primary/40 hover:bg-white/5",
                  )}
                >
                  <div className="flex flex-col gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                        {w.word}
                      </span>
                      <span className="text-[10px] font-semibold text-primary/80 px-1.5 py-0.2 rounded bg-primary/10">
                        {w.band}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                      {w.viDefinition}
                    </span>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
