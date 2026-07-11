import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DictionaryClient } from "@/app/(main)/dictionary/dictionary-client";

vi.mock("@/lib/api-client", () => ({
  wordsApi: {
    save: vi.fn().mockResolvedValue({ id: "note-1" }),
  },
}));

describe("DictionaryClient component", () => {
  it("renders default IELTS word ubiquitous with detailed definitions", () => {
    render(<DictionaryClient />);

    expect(screen.getAllByText("ubiquitous").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Band 8.0+").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Có mặt ở khắp mọi nơi, phổ biến rộng rãi.").length).toBeGreaterThan(0);
  });

  it("switches to another IELTS word when clicking hot word pill", async () => {
    render(<DictionaryClient />);

    const mitigateBtns = screen.getAllByText("mitigate");
    fireEvent.click(mitigateBtns[0]);

    await waitFor(() => {
      expect(screen.getAllByText("Làm giảm nhẹ, làm dịu bớt (hậu quả, rủi ro, tác hại).").length).toBeGreaterThan(0);
    });
  });
});
