import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DictationPlayer } from "@/app/(main)/dictation/[videoId]/dictation-player";
import { LocaleContext } from "@/lib/locale-context";
import { messages } from "@/lib/i18n";
import type { LocaleContextValue } from "@/lib/locale-context";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
}));

vi.mock("@/components/transcript-sidebar", () => ({
  TranscriptSidebar: () => null,
}));

const mockVideo = {
  id: "v1",
  youtubeId: "abc123",
  title: "Test Dictation",
  createdAt: new Date(),
  updatedAt: new Date(),
} as never;

const mockSentences = [
  { id: "s1", text: "The quick brown fox", startMs: 0, endMs: 3000, index: 0, videoId: "v1" },
  { id: "s2", text: "Jumps over the lazy dog", startMs: 3000, endMs: 6000, index: 1, videoId: "v1" },
] as never[];

function renderEn() {
  const ctx: LocaleContextValue = { locale: "en", setLocale: vi.fn(), t: messages.en };
  return render(
    <LocaleContext.Provider value={ctx}>
      <DictationPlayer video={mockVideo} sentences={mockSentences} initialDone={0} />
    </LocaleContext.Provider>,
  );
}

function renderVi() {
  const ctx: LocaleContextValue = { locale: "vi", setLocale: vi.fn(), t: messages.vi };
  return render(
    <LocaleContext.Provider value={ctx}>
      <DictationPlayer video={mockVideo} sentences={mockSentences} initialDone={0} />
    </LocaleContext.Provider>,
  );
}

describe("DictationPlayer – EN locale", () => {
  it("renders video title", () => {
    renderEn();
    expect(screen.getAllByText("Test Dictation").length).toBeGreaterThan(0);
  });

  it("shows English action buttons", () => {
    renderEn();
    expect(screen.getByText("Replay")).toBeDefined();
    expect(screen.getByText("Hint word")).toBeDefined();
    expect(screen.getByText("Show answer")).toBeDefined();
    expect(screen.getByText("Check")).toBeDefined();
  });

  it("shows English legend labels", () => {
    renderEn();
    expect(screen.getByText("Correct")).toBeDefined();
    expect(screen.getByText("Wrong")).toBeDefined();
    expect(screen.getByText("Typing")).toBeDefined();
  });

  it("shows English shortcut labels", () => {
    renderEn();
    expect(screen.getByText("replay")).toBeDefined();
    expect(screen.getByText("next")).toBeDefined();
  });

  it("shows English switch labels", () => {
    renderEn();
    expect(screen.getByText("Auto next")).toBeDefined();
    expect(screen.getByText("Hide transcript")).toBeDefined();
  });

  it("shows English input placeholder", () => {
    renderEn();
    const input = screen.getByPlaceholderText(/Type what you hear/);
    expect(input).toBeDefined();
  });

  it("shows English progress label", () => {
    renderEn();
    expect(screen.getByText("Progress")).toBeDefined();
  });

  it("shows English transcript label", () => {
    renderEn();
    expect(screen.getByText("Transcript")).toBeDefined();
  });
});

describe("DictationPlayer – VI locale", () => {
  it("shows Vietnamese action buttons", () => {
    renderVi();
    expect(screen.getByText("Phát lại")).toBeDefined();
    expect(screen.getByText("Gợi ý từ")).toBeDefined();
    expect(screen.getByText("Xem đáp án")).toBeDefined();
    expect(screen.getByText("Kiểm tra")).toBeDefined();
  });

  it("shows Vietnamese legend labels", () => {
    renderVi();
    expect(screen.getByText("Đúng")).toBeDefined();
    expect(screen.getByText("Sai")).toBeDefined();
    expect(screen.getByText("Đang gõ")).toBeDefined();
  });

  it("shows Vietnamese shortcut labels", () => {
    renderVi();
    expect(screen.getByText("phát lại")).toBeDefined();
    expect(screen.getByText("tiếp theo")).toBeDefined();
  });

  it("shows Vietnamese switch labels", () => {
    renderVi();
    expect(screen.getByText("Tự động tiếp")).toBeDefined();
    expect(screen.getByText("Ẩn transcript")).toBeDefined();
  });

  it("shows Vietnamese input placeholder", () => {
    renderVi();
    const input = screen.getByPlaceholderText(/Gõ câu bạn nghe được/);
    expect(input).toBeDefined();
  });

  it("shows Vietnamese progress label", () => {
    renderVi();
    expect(screen.getByText("Tiến độ")).toBeDefined();
  });
});
