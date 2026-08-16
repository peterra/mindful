import { describe, expect, it } from "vitest";
import {
  FLOWER_COLORS,
  MAX_FLOWERS,
  isFlowerColorId,
  isValidFlowerColors,
  getFlowerSlotPosition,
  getStemPath,
} from "./name-it-layout";

describe("FLOWER_COLORS", () => {
  it("has exactly 5 colors", () => {
    expect(FLOWER_COLORS).toHaveLength(5);
  });

  it("has unique ids", () => {
    const ids = FLOWER_COLORS.map((c) => c.id);
    expect(new Set(ids).size).toBe(5);
  });
});

describe("isFlowerColorId", () => {
  it("accepts a known color id", () => {
    expect(isFlowerColorId("rose")).toBe(true);
  });

  it("rejects an unknown string", () => {
    expect(isFlowerColorId("chartreuse")).toBe(false);
  });
});

describe("isValidFlowerColors", () => {
  it("accepts a valid non-empty array of known colors", () => {
    expect(isValidFlowerColors(["rose", "amber"])).toBe(true);
  });

  it("rejects an empty array", () => {
    expect(isValidFlowerColors([])).toBe(false);
  });

  it("rejects an array longer than MAX_FLOWERS", () => {
    const tooMany = Array(MAX_FLOWERS + 1).fill("rose");
    expect(isValidFlowerColors(tooMany)).toBe(false);
  });

  it("rejects an array containing an unknown color", () => {
    expect(isValidFlowerColors(["rose", "chartreuse"])).toBe(false);
  });

  it("rejects a non-array value", () => {
    expect(isValidFlowerColors("rose")).toBe(false);
  });
});

describe("getFlowerSlotPosition", () => {
  it("places a single flower directly above the grip point", () => {
    const grip = getFlowerSlotPosition(0, 1);
    const other = getFlowerSlotPosition(0, 1);
    expect(grip).toEqual(other);
    expect(grip.y).toBeLessThan(120); // above the grip point
  });

  it("returns distinct positions for each of several flowers", () => {
    const total = 5;
    const positions = Array.from({ length: total }, (_, i) =>
      getFlowerSlotPosition(i, total)
    );
    const uniqueX = new Set(positions.map((p) => Math.round(p.x)));
    expect(uniqueX.size).toBe(total);
  });
});

describe("getStemPath", () => {
  it("returns an SVG path string starting at the grip point", () => {
    const path = getStemPath(0, 3);
    expect(path.startsWith("M123,120")).toBe(true);
  });
});
