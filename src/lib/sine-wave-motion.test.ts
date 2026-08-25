import { describe, expect, it } from "vitest";
import { lerp, targetSpeedFromMouseX, MIN_SPEED, MAX_SPEED } from "./sine-wave-motion";

describe("lerp", () => {
  it("moves halfway to the target at factor 0.5", () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
  });

  it("returns current unchanged at factor 0", () => {
    expect(lerp(3, 10, 0)).toBe(3);
  });

  it("returns target exactly at factor 1", () => {
    expect(lerp(3, 10, 1)).toBe(10);
  });

  it("returns the same value when current equals target", () => {
    expect(lerp(7, 7, 0.5)).toBe(7);
  });
});

describe("targetSpeedFromMouseX", () => {
  it("returns MIN_SPEED at the left edge", () => {
    expect(targetSpeedFromMouseX(0, 1000)).toBe(MIN_SPEED);
  });

  it("returns MAX_SPEED at the right edge", () => {
    expect(targetSpeedFromMouseX(1000, 1000)).toBe(MAX_SPEED);
  });

  it("returns the midpoint at the horizontal center", () => {
    expect(targetSpeedFromMouseX(500, 1000)).toBeCloseTo(
      (MIN_SPEED + MAX_SPEED) / 2
    );
  });

  it("clamps values left of the visible area", () => {
    expect(targetSpeedFromMouseX(-50, 1000)).toBe(MIN_SPEED);
  });

  it("clamps values right of the visible area", () => {
    expect(targetSpeedFromMouseX(1200, 1000)).toBe(MAX_SPEED);
  });

  it("guards against a zero-width container", () => {
    expect(targetSpeedFromMouseX(50, 0)).toBe(MIN_SPEED);
  });

  it("respects custom min/max bounds", () => {
    expect(targetSpeedFromMouseX(0, 100, 1, 5)).toBe(1);
    expect(targetSpeedFromMouseX(100, 100, 1, 5)).toBe(5);
  });
});
