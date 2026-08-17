import { describe, expect, it } from "vitest";
import {
  FLOWER_COLORS,
  MAX_FLOWERS,
  isFlowerColorId,
  isValidFlowerColors,
  getFlowerSlotPosition,
  getStemPath,
  getHazeColor,
  getHazeOpacity,
} from "./name-it-layout";

describe("FLOWER_COLORS", () => {
  it("has exactly 7 colors", () => {
    expect(FLOWER_COLORS).toHaveLength(7);
  });

  it("has unique ids", () => {
    const ids = FLOWER_COLORS.map((c) => c.id);
    expect(new Set(ids).size).toBe(7);
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

  it("accepts an empty array", () => {
    expect(isValidFlowerColors([])).toBe(true);
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

describe("getHazeColor", () => {
  it("returns the light color at intensity 0", () => {
    expect(getHazeColor(0)).toBe("#e8e8e8");
  });

  it("returns the dark color at intensity 100", () => {
    expect(getHazeColor(100)).toBe("#4a4a4a");
  });

  it("returns the midpoint color at intensity 50", () => {
    expect(getHazeColor(50)).toBe("#999999");
  });

  it("clamps intensity above 100 to the same result as 100", () => {
    expect(getHazeColor(150)).toBe(getHazeColor(100));
  });

  it("clamps intensity below 0 to the same result as 0", () => {
    expect(getHazeColor(-20)).toBe(getHazeColor(0));
  });
});

describe("getHazeOpacity", () => {
  it("returns 0.25 at intensity 0", () => {
    expect(getHazeOpacity(0)).toBeCloseTo(0.25);
  });

  it("returns 0.7 at intensity 100", () => {
    expect(getHazeOpacity(100)).toBeCloseTo(0.7);
  });

  it("returns the midpoint at intensity 50", () => {
    expect(getHazeOpacity(50)).toBeCloseTo(0.475);
  });
});
