import { describe, expect, it } from "vitest";
import {
  VISUALIZATION_STYLES,
  isValidVisualizationStyle,
  isValidPresetName,
  isValidPresetSpeed,
} from "./visualization-presets";

describe("VISUALIZATION_STYLES", () => {
  it("has exactly bloom and sine", () => {
    expect(VISUALIZATION_STYLES).toEqual(["bloom", "sine"]);
  });
});

describe("isValidVisualizationStyle", () => {
  it("accepts bloom", () => {
    expect(isValidVisualizationStyle("bloom")).toBe(true);
  });

  it("accepts sine", () => {
    expect(isValidVisualizationStyle("sine")).toBe(true);
  });

  it("rejects an unknown style", () => {
    expect(isValidVisualizationStyle("linear")).toBe(false);
  });

  it("rejects non-string values", () => {
    expect(isValidVisualizationStyle(123)).toBe(false);
    expect(isValidVisualizationStyle(undefined)).toBe(false);
    expect(isValidVisualizationStyle(null)).toBe(false);
  });
});

describe("isValidPresetName", () => {
  it("accepts a normal name", () => {
    expect(isValidPresetName("Deep focus")).toBe(true);
  });

  it("rejects an empty string", () => {
    expect(isValidPresetName("")).toBe(false);
  });

  it("rejects a whitespace-only string", () => {
    expect(isValidPresetName("   ")).toBe(false);
  });

  it("rejects non-string values", () => {
    expect(isValidPresetName(123)).toBe(false);
    expect(isValidPresetName(undefined)).toBe(false);
  });
});

describe("isValidPresetSpeed", () => {
  it("accepts values inside the slider range", () => {
    expect(isValidPresetSpeed(1)).toBe(true);
  });

  it("accepts the boundaries", () => {
    expect(isValidPresetSpeed(0.01)).toBe(true);
    expect(isValidPresetSpeed(2)).toBe(true);
  });

  it("rejects values below the minimum", () => {
    expect(isValidPresetSpeed(0)).toBe(false);
  });

  it("rejects values above the maximum", () => {
    expect(isValidPresetSpeed(2.5)).toBe(false);
  });

  it("rejects NaN and Infinity", () => {
    expect(isValidPresetSpeed(NaN)).toBe(false);
    expect(isValidPresetSpeed(Infinity)).toBe(false);
  });

  it("rejects non-number values", () => {
    expect(isValidPresetSpeed("1")).toBe(false);
  });
});
