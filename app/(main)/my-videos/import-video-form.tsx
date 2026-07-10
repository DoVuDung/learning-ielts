"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link2, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { videosApi } from "@/lib/api-client";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const CATEGORIES = ["general", "TED", "BBC", "IELTS", "News", "Science", "Business"];

export function ImportVideoForm() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [level, setLevel] = useState("B2");
  const [category, setCategory] = useState("general");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleImport() {
    if (!url.trim()) return;
    setStatus("loading");
    setMessage("");

    try {
      const data = await videosApi.import({ url, level, category });
      setStatus("success");
      setMessage(`Đã import: "${data.title}"`);
      setUrl("");
      router.refresh();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Import thất bại";
      // Try to parse JSON error from BE
      let displayMsg = msg;
      try { displayMsg = JSON.parse(msg).message ?? msg; } catch { /* raw string */ }
      setStatus("error");
      setMessage(displayMsg ?? "Import thất bại");
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-sm font-semibold text-foreground">Import video từ YouTube</h2>
        <p className="text-xs text-muted-foreground">
          Dán link YouTube — chúng tôi tự động lấy transcript để tạo bài dictation.
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
