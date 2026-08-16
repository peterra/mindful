import { describe, expect, it } from "vitest";
import { EMOTION_WORD_BANK } from "./emotion-words";

describe("EMOTION_WORD_BANK", () => {
  it("has at least 4 categories", () => {
    expect(EMOTION_WORD_BANK.length).toBeGreaterThanOrEqual(4);
  });

  it("every category has at least one word", () => {
    for (const group of EMOTION_WORD_BANK) {
      expect(group.words.length).toBeGreaterThan(0);
    }
  });

  it("has no duplicate words across the whole bank", () => {
    const allWords = EMOTION_WORD_BANK.flatMap((g) => g.words);
    expect(new Set(allWords).size).toBe(allWords.length);
  });
});
