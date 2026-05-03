import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ShadowingPlayer } from "@/app/(main)/shadowing/[videoId]/shadowing-player";
import { LocaleContext, LocaleProvider } from "@/lib/locale-context";
import type { LocaleContextValue } from "@/lib/locale-context";
import { messages } from "@/lib/i18n";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn(), push: vi.fn() }),
}));

const mockVideo = {
  id: "v1",
  youtubeId: "abc123",
  title: "Test Video",
  createdAt: new Date(),
  updatedAt: new Date(),
} as never;

const mockSentences = [
  { id: "s1", text: "Hello world how are you", startMs: 0, endMs: 2000, index: 0, videoId: "v1" },
  { id: "s2", text: "I am doing well thank you", startMs: 2000, endMs: 4000, index: 1, videoId: "v1" },
] as never[];

function renderEn() {
  const ctx: LocaleContextValue = { locale: "en", setLocale: vi.fn(), t: messages.en };
  return render(
    <LocaleContext.Provider value={ctx}>
      <ShadowingPlayer video={mockVideo} sentences={mockSentences} />
    </LocaleContext.Provider>,
  );
}

function renderVi() {
  const ctx: LocaleContextValue = { locale: "vi", setLocale: vi.fn(), t: messages.vi };
  return render(
    <LocaleContext.Provider value={ctx}>
      <ShadowingPlayer video={mockVideo} sentences={mockSentences} />
    </LocaleContext.Provider>,
  );
}

describe("ShadowingPlayer – EN locale", () => {
  it("renders video title", () => {
    renderEn();
    expect(screen.getAllByText("Test Video").length).toBeGreaterThan(0);
  });

  it("shows English step labels", () => {
    renderEn();
    expect(screen.getByText("Listen")).toBeDefined();
    expect(screen.getByText("Click words")).toBeDefined();
    expect(screen.getByText("Next")).toBeDefined();
  });

  it("shows English action buttons", () => {
    renderEn();
    expect(screen.getByText("Replay")).toBeDefined();
    expect(screen.getByText("Reveal all")).toBeDefined();
    expect(screen.getByRole("button", { name: /Done, next/ })).toBeDefined();
  });

  it("shows English tips section", () => {
    renderEn();
    expect(screen.getByText("How to practice")).toBeDefined();
    expect(screen.getByText(/Listen → repeat/)).toBeDefined();
  });

  it("shows EN on the lang toggle button", () => {
    renderEn();
    const toggle = screen.getByRole("button", { name: "Toggle language" });
    expect(toggle.textContent?.trim()).toBe("EN");
  });

  it("shows English transcript labels", () => {
    renderEn();
    expect(screen.getByText("Transcript")).toBeDefined();
    expect(screen.getByText("Hide all")).toBeDefined();
    expect(screen.getByText("Progress")).toBeDefined();
  });
});

describe("ShadowingPlayer – VI locale", () => {
  it("shows Vietnamese step labels", () => {
    renderVi();
    expect(screen.getByText("Nghe câu")).toBeDefined();
    expect(screen.getByText("Click từng từ")).toBeDefined();
    expect(screen.getByText("Tiếp theo")).toBeDefined();
  });

  it("shows Vietnamese action buttons", () => {
    renderVi();
    expect(screen.getByText("Nghe lại")).toBeDefined();
    expect(screen.getByRole("button", { name: /Xong, tiếp theo/ })).toBeDefined();
  });

  it("shows Vietnamese tips section", () => {
    renderVi();
    expect(screen.getByText("Cách luyện")).toBeDefined();
    expect(screen.getByText(/Nghe câu → lặp lại/)).toBeDefined();
  });

  it("shows VI on the lang toggle button", () => {
    renderVi();
    const toggle = screen.getByRole("button", { name: "Toggle language" });
    expect(toggle.textContent?.trim()).toBe("VI");
  });

  it("shows Vietnamese transcript labels", () => {
    renderVi();
    expect(screen.getByText("Ẩn tất cả")).toBeDefined();
    expect(screen.getByText("Tiến độ")).toBeDefined();
  });
});

describe("ShadowingPlayer – lang toggle", () => {
  it("clicking toggle switches from VI to EN", () => {
    render(
      <LocaleProvider initialLocale="vi">
        <ShadowingPlayer video={mockVideo} sentences={mockSentences} />
      </LocaleProvider>,
    );

    const toggle = screen.getByRole("button", { name: "Toggle language" });
    expect(toggle.textContent?.trim()).toBe("VI");
    expect(screen.getByText("Nghe câu")).toBeDefined();

    fireEvent.click(toggle);

    expect(toggle.textContent?.trim()).toBe("EN");
    expect(screen.getByText("Listen")).toBeDefined();
  });

  it("clicking toggle switches from EN to VI", () => {
    render(
      <LocaleProvider initialLocale="en">
        <ShadowingPlayer video={mockVideo} sentences={mockSentences} />
      </LocaleProvider>,
    );

    const toggle = screen.getByRole("button", { name: "Toggle language" });
    expect(toggle.textContent?.trim()).toBe("EN");

    fireEvent.click(toggle);

    expect(toggle.textContent?.trim()).toBe("VI");
    expect(screen.getByText("Nghe câu")).toBeDefined();
  });
});
