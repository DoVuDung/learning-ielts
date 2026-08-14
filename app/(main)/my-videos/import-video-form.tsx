"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link2, Loader2, CheckCircle2, AlertCircle, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { videosApi } from "@/lib/api-client";
import { fetchTranscriptClientSide } from "@/lib/youtube-transcript";
import { extractYoutubeId } from "@/lib/utils";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const CATEGORIES = ["general", "TED", "BBC", "IELTS", "News", "Science", "Business"];

function parseManualTranscript(text: string): Array<{ text: string; startMs: number; endMs: number }> {
  const lines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const sentences: Array<{ text: string; startMs: number; endMs: number }> = [];
  let currentMs = 0;

  for (const line of lines) {
    const wordCount = line.split(/\s+/).length;
    const duration = Math.max(2500, wordCount * 350);
    sentences.push({
      text: line,
      startMs: currentMs,
      endMs: currentMs + duration,
    });
    currentMs += duration + 500;
  }

  return sentences;
}

export function ImportVideoForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [level, setLevel] = useState("B2");
  const [category, setCategory] = useState("general");
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualText, setManualText] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleImport() {
    if (!url.trim()) return;
    setStatus("loading");
    setMessage("Đang lấy thông tin video & transcript...");

    try {
      // If manual text is provided, use it directly
      if (manualText.trim()) {
        const sentences = parseManualTranscript(manualText);
        const data = await videosApi.import({ url, level, category, sentences });
        setStatus("success");
        setMessage(`Đã import thành công với transcript thủ công: "${data.title}"`);
        setUrl("");
        setManualText("");
        setShowManualInput(false);
        router.refresh();
        return;
      }

      // Standard import attempt
      const data = await videosApi.import({ url, level, category });
      setStatus("success");
      setMessage(`Đã import: "${data.title}"`);
      setUrl("");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Import thất bại";
      let displayMsg = msg;
      try { displayMsg = JSON.parse(msg).message ?? msg; } catch { /* raw string */ }

      // Client-side fallback if backend cloud IP was blocked by YouTube
      const youtubeId = extractYoutubeId(url);
      if (youtubeId && (displayMsg.includes("transcript") || displayMsg.includes("No transcript"))) {
        setMessage("Đang lấy phụ đề trực tiếp từ YouTube...");
        const clientSentences = await fetchTranscriptClientSide(youtubeId);
        if (clientSentences && clientSentences.length > 0) {
          try {
            const data = await videosApi.import({ url, level, category, sentences: clientSentences });
            setStatus("success");
            setMessage(`Đã import thành công: "${data.title}"`);
            setUrl("");
            router.refresh();
            return;
          } catch (retryErr) {
            const retryMsg = retryErr instanceof Error ? retryErr.message : "Import thất bại";
            displayMsg = retryMsg;
          }
        }
      }

      setStatus("error");
      setShowManualInput(true);
      setMessage(
        "Không thể lấy transcript tự động từ YouTube cho video này. " +
        "Bạn có thể dán nội dung transcript bên dưới để tạo bài dictation thủ công."
      );
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold text-foreground">Import video từ YouTube</h2>
        <p className="text-xs text-muted-foreground">
          Dán link YouTube — hệ thống tự động trích xuất phụ đề để tạo bài dictation.
        </p>
      </div>

      {/* URL input */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={url}
            onChange={(e) => { setUrl(e.target.value); setStatus("idle"); }}
            placeholder="https://www.youtube.com/watch?v=..."
            className="pl-9"
            onKeyDown={(e) => e.key === "Enter" && handleImport()}
          />
        </div>
        <Button onClick={handleImport} disabled={status === "loading" || !url.trim()}>
          {status === "loading" ? (
            <Loader2 className="size-4 animate-spin" />
          ) : "Import"}
        </Button>
      </div>

      {/* Level + Category */}
      <div className="flex flex-wrap gap-4">
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground font-medium">Trình độ</span>
          <div className="flex gap-1.5">
            {LEVELS.map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className={`px-2.5 py-1 rounded text-xs font-semibold border transition-colors ${
                  level === l
                    ? "bg-primary text-white border-primary"
                    : "bg-transparent text-muted-foreground border-border hover:border-primary/50"
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-muted-foreground font-medium">Danh mục</span>
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-2.5 py-1 rounded text-xs font-medium border transition-colors ${
                  category === c
                    ? "bg-primary text-white border-primary"
                    : "bg-transparent text-muted-foreground border-border hover:border-primary/50"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Toggle Manual Transcript */}
      <div className="flex flex-col gap-2 pt-2 border-t border-border/50">
        <button
          type="button"
          onClick={() => setShowManualInput(!showManualInput)}
          className="flex items-center gap-1.5 text-xs text-primary font-medium hover:underline self-start"
        >
          <FileText className="size-3.5" />
          {showManualInput ? "Ẩn nhập transcript thủ công" : "Nhập / Dán transcript thủ công (Tùy chọn)"}
          {showManualInput ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
        </button>

        {showManualInput && (
          <div className="flex flex-col gap-2">
            <textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="Dán các câu transcript Tiếng Anh vào đây (mỗi câu một dòng)..."
              rows={4}
              className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="text-[11px] text-muted-foreground">
              Mẹo: Mỗi dòng văn bản sẽ được tự động chuyển thành một câu dictation.
            </p>
          </div>
        )}
      </div>

      {/* Status message */}
      {status === "success" && (
        <div className="flex items-center gap-2 text-emerald-400 text-sm">
          <CheckCircle2 className="size-4 shrink-0" />
          {message}
        </div>
      )}
      {status === "error" && (
        <div className="flex items-center gap-2 text-rose-400 text-sm">
          <AlertCircle className="size-4 shrink-0" />
          {message}
        </div>
      )}
    </div>
  );
}
