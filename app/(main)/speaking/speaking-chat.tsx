"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const TOPICS = [
  { id: "daily", label: "Daily Life", prompt: "Talk about your daily routine, hobbies, and lifestyle" },
  { id: "travel", label: "Travel", prompt: "Discuss travel experiences, dream destinations, and culture" },
  { id: "ielts-p1", label: "IELTS Part 1", prompt: "IELTS Speaking Part 1 — personal questions about home, family, work, and study" },
  { id: "ielts-p2", label: "IELTS Part 2", prompt: "IELTS Speaking Part 2 — describe a person, place, event, or object" },
  { id: "ielts-p3", label: "IELTS Part 3", prompt: "IELTS Speaking Part 3 — abstract discussion on society, technology, environment" },
  { id: "work", label: "Work & Career", prompt: "Discuss work, career goals, and professional development" },
  { id: "tech", label: "Technology", prompt: "Talk about technology, social media, and the digital world" },
  { id: "env", label: "Environment", prompt: "Discuss environmental issues, climate change, and sustainability" },
];

type Message = { role: "user" | "assistant"; content: string };

export function SpeakingChat() {
  const [topic, setTopic] = useState(TOPICS[0]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [started, setStarted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function startConversation() {
    setStarted(true);
    setMessages([]);
    setStreaming(true);

    const seed: Message[] = [{ role: "user", content: `Let's practice speaking English. Topic: ${topic.prompt}. Please start the conversation with a question.` }];

    const res = await fetch("/api/speaking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: seed, topic: topic.label }),
    });

    if (!res.body) { setStreaming(false); return; }

    let text = "";
    setMessages([{ role: "assistant", content: "" }]);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
      setMessages([{ role: "assistant", content: text }]);
    }

    setStreaming(false);
    inputRef.current?.focus();
  }

  async function send() {
    if (!input.trim() || streaming) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setStreaming(true);

    const res = await fetch("/api/speaking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: next, topic: topic.label }),
    });

    if (!res.body) { setStreaming(false); return; }

    let text = "";
    setMessages([...next, { role: "assistant", content: "" }]);
    const reader = res.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
      setMessages([...next, { role: "assistant", content: text }]);
    }

    setStreaming(false);
    inputRef.current?.focus();
  }

  function reset() {
    setStarted(false);
    setMessages([]);
    setInput("");
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Sidebar: topic picker */}
      <aside className="w-56 shrink-0 border-r border-border flex flex-col gap-1 p-3 overflow-y-auto">
        <p className="text-[10px] font-semibold text-muted-foreground tracking-widest px-2 mb-1">CHỦ ĐỀ</p>
        {TOPICS.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTopic(t); reset(); }}
            className={cn(
              "text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors",
              topic.id === t.id
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </aside>

      {/* Chat area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {!started ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <h2 className="text-lg font-semibold">{topic.label}</h2>
              <p className="text-sm text-muted-foreground max-w-xs">{topic.prompt}</p>
            </div>
            <div className="rounded-lg bg-primary/5 border border-primary/20 px-5 py-4 max-w-sm text-xs text-muted-foreground flex flex-col gap-1.5">
              <p className="text-primary font-medium mb-1">Cách luyện</p>
              <p>• AI sẽ đặt câu hỏi, bạn trả lời bằng tiếng Anh</p>
              <p>• AI phản hồi và sửa lỗi ngữ pháp / từ vựng</p>
              <p>• Luyện tập tự nhiên như hội thoại thật</p>
            </div>
            <Button onClick={startConversation} className="gap-2 px-8">
              Bắt đầu hội thoại
            </Button>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
              {messages.map((m, i) => (
                <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                  <div
                    className={cn(
                      "max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap",
                      m.role === "user"
                        ? "bg-primary text-white rounded-br-sm"
                        : "bg-card border border-border text-foreground rounded-bl-sm"
                    )}
                  >
                    {m.content || (streaming && i === messages.length - 1 ? (
                      <span className="flex gap-1">
                        <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
                      </span>
                    ) : "")}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="flex items-center gap-2 px-4 py-3 border-t border-border bg-background/80 backdrop-blur-sm shrink-0">
              <Button variant="ghost" size="icon" className="size-8 shrink-0" onClick={reset}>
                <RotateCcw className="size-4" />
              </Button>
              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                placeholder="Type your response in English..."
                disabled={streaming}
                className="flex-1"
              />
              <Button size="icon" className="size-9 shrink-0" onClick={send} disabled={streaming || !input.trim()}>
                {streaming ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
