import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WordRevealChips } from "@/components/word-reveal-chips";
import { LocaleContext } from "@/lib/locale-context";
import { messages } from "@/lib/i18n";
import type { LocaleContextValue } from "@/lib/locale-context";

function renderEn(props: React.ComponentProps<typeof WordRevealChips>) {
  const ctx: LocaleContextValue = {
    locale: "en",
    setLocale: vi.fn(),
    t: messages.en,
  };
  return render(
    <LocaleContext.Provider value={ctx}>
      <WordRevealChips {...props} />
    </LocaleContext.Provider>,
  );
}

function renderVi(props: React.ComponentProps<typeof WordRevealChips>) {
  const ctx: LocaleContextValue = {
    locale: "vi",
    setLocale: vi.fn(),
    t: messages.vi,
  };
  return render(
    <LocaleContext.Provider value={ctx}>
      <WordRevealChips {...props} />
    </LocaleContext.Provider>,
  );
}

describe("WordRevealChips – EN locale", () => {
  it("shows 'See all' button", () => {
    renderEn({ text: "Hello world", sentenceIndex: 0, sentenceTotal: 3 });
    expect(screen.getByText("See all")).toBeDefined();
  });

  it("shows sentence prefix in English", () => {
    renderEn({ text: "Hello world", sentenceIndex: 0, sentenceTotal: 3 });
    expect(screen.getByText(/Sentence #1\/3/)).toBeDefined();
  });

  it("chips have English hint title when hidden", () => {
    renderEn({ text: "Hello" });
    const chip = screen.getByTitle("Click to reveal");
    expect(chip).toBeDefined();
  });

  it("shows '✓ Done' when all chips revealed via forceReveal", () => {
    renderEn({ text: "Hi", forceReveal: true, sentenceIndex: 0, sentenceTotal: 1 });
    expect(screen.getByText("✓ Done")).toBeDefined();
  });

  it("shows English repeat prompt after all chips revealed", () => {
    renderEn({ text: "Hi", forceReveal: true });
    expect(screen.getByText(/Repeat the sentence above/)).toBeDefined();
    expect(screen.getByText("Done, next")).toBeDefined();
  });

  it("reveals a chip on click and shows word count", () => {
    renderEn({ text: "Hello world", sentenceIndex: 0, sentenceTotal: 1 });
    const chips = screen.getAllByTitle("Click to reveal");
    fireEvent.click(chips[0]);
    expect(screen.getByText(/1\/2 words/)).toBeDefined();
  });

  it("'See all' reveals all chips and fires callback", () => {
    const onAllRevealed = vi.fn();
    renderEn({ text: "Hello world", onAllRevealed });
    fireEvent.click(screen.getByRole("button", { name: /See all/i }));
    expect(onAllRevealed).toHaveBeenCalled();
    expect(screen.getByText("✓ Done")).toBeDefined();
  });
});

describe("WordRevealChips – VI locale", () => {
  it("shows 'Xem tất cả' button", () => {
    renderVi({ text: "Hello world", sentenceIndex: 0, sentenceTotal: 3 });
    expect(screen.getByText("Xem tất cả")).toBeDefined();
  });

  it("shows sentence prefix in Vietnamese", () => {
    renderVi({ text: "Hello world", sentenceIndex: 0, sentenceTotal: 3 });
    expect(screen.getByText(/Câu #1\/3/)).toBeDefined();
  });

  it("chips have Vietnamese hint title when hidden", () => {
    renderVi({ text: "Hello" });
    const chip = screen.getByTitle("Click để xem từ");
    expect(chip).toBeDefined();
  });

  it("shows '✓ Hoàn thành' when all chips revealed", () => {
    renderVi({ text: "Hi", forceReveal: true, sentenceIndex: 0, sentenceTotal: 1 });
    expect(screen.getByText("✓ Hoàn thành")).toBeDefined();
  });

  it("shows Vietnamese repeat prompt after all revealed", () => {
    renderVi({ text: "Hi", forceReveal: true });
    expect(screen.getByText(/Lặp lại câu trên/)).toBeDefined();
    expect(screen.getByText("Xong, tiếp theo")).toBeDefined();
  });

  it("reveals a chip on click and shows word count in Vietnamese", () => {
    renderVi({ text: "Hello world", sentenceIndex: 0, sentenceTotal: 1 });
    const chips = screen.getAllByTitle("Click để xem từ");
    fireEvent.click(chips[0]);
    expect(screen.getByText(/1\/2 từ/)).toBeDefined();
  });
});
