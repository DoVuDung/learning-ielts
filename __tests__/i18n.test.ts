import { describe, it, expect } from "vitest";
import { messages } from "@/lib/i18n";

describe("i18n messages", () => {
  it("en and vi have identical keys", () => {
    const enKeys = Object.keys(messages.en).sort();
    const viKeys = Object.keys(messages.vi).sort();
    expect(enKeys).toEqual(viKeys);
  });

  it("no key has an empty string value", () => {
    for (const [key, value] of Object.entries(messages.en)) {
      expect(value, `en.${key} must not be empty`).toBeTruthy();
    }
    for (const [key, value] of Object.entries(messages.vi)) {
      expect(value, `vi.${key} must not be empty`).toBeTruthy();
    }
  });

  it("en and vi differ on locale-specific strings", () => {
    expect(messages.en.step1).not.toBe(messages.vi.step1);
    expect(messages.en.doneNext).not.toBe(messages.vi.doneNext);
    expect(messages.en.wordsUnit).not.toBe(messages.vi.wordsUnit);
    expect(messages.en.chipHint).not.toBe(messages.vi.chipHint);
  });

  it("en uses English text for key strings", () => {
    expect(messages.en.step1).toBe("Listen");
    expect(messages.en.step2).toBe("Click words");
    expect(messages.en.doneNext).toBe("Done, next");
    expect(messages.en.seeAll).toBe("See all");
    expect(messages.en.chipHint).toBe("Click to reveal");
    expect(messages.en.completed).toBe("✓ Done");
    expect(messages.en.progress).toBe("Progress");
  });

  it("vi uses Vietnamese text for key strings", () => {
    expect(messages.vi.step1).toBe("Nghe câu");
    expect(messages.vi.step2).toBe("Click từng từ");
    expect(messages.vi.doneNext).toBe("Xong, tiếp theo");
    expect(messages.vi.seeAll).toBe("Xem tất cả");
    expect(messages.vi.chipHint).toBe("Click để xem từ");
    expect(messages.vi.completed).toBe("✓ Hoàn thành");
    expect(messages.vi.progress).toBe("Tiến độ");
  });
});
