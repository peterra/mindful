export type FlowerColorId =
  | "rose"
  | "amber"
  | "sage"
  | "lavender"
  | "blush"
  | "black"
  | "gray";

export interface FlowerColorDef {
  id: FlowerColorId;
  label: string;
  hex: string;
}

export const FLOWER_COLORS: FlowerColorDef[] = [
  { id: "rose", label: "Rose", hex: "#d9647a" },
  { id: "amber", label: "Amber", hex: "#e8b34a" },
  { id: "sage", label: "Sage", hex: "#7a9a6a" },
  { id: "lavender", label: "Lavender", hex: "#8a7ec7" },
  { id: "blush", label: "Blush", hex: "#e8c9d4" },
  { id: "black", label: "Black", hex: "#222222" },
  { id: "gray", label: "Gray", hex: "#9e9e9e" },
];

export const MAX_FLOWERS = 10;

export function isFlowerColorId(value: string): value is FlowerColorId {
  return FLOWER_COLORS.some((c) => c.id === value);
}

export function isValidFlowerColors(
  colors: unknown
): colors is FlowerColorId[] {
  return (
    Array.isArray(colors) &&
    colors.length <= MAX_FLOWERS &&
    colors.every((c) => typeof c === "string" && isFlowerColorId(c))
  );
}

export interface Point {
  x: number;
  y: number;
}

const GRIP_POINT: Point = { x: 123, y: 120 };
const FLOWER_RADIUS = 90;
const FAN_SPREAD_DEGREES = 90;

export function getFlowerSlotPosition(index: number, total: number): Point {
  const startAngle = -90 - FAN_SPREAD_DEGREES / 2;
  const angle =
    total <= 1 ? -90 : startAngle + (FAN_SPREAD_DEGREES * index) / (total - 1);
  const rad = (angle * Math.PI) / 180;
  return {
    x: GRIP_POINT.x + FLOWER_RADIUS * Math.cos(rad),
    y: GRIP_POINT.y + FLOWER_RADIUS * Math.sin(rad),
  };
}

export function getStemPath(index: number, total: number): string {
  const pos = getFlowerSlotPosition(index, total);
  const midX = (GRIP_POINT.x + pos.x) / 2;
  const midY = GRIP_POINT.y - 20;
  return `M${GRIP_POINT.x},${GRIP_POINT.y} Q${midX},${midY} ${pos.x},${pos.y}`;
}

export const MIN_HAZE_INTENSITY = 0;
export const MAX_HAZE_INTENSITY = 100;
export const DEFAULT_HAZE_INTENSITY = 50;

export const HAZE_ELLIPSE = { cx: 145, cy: 120, rx: 65, ry: 50 };
export const HAZE_BLUR_STD_DEVIATION = 18;

const HAZE_LIGHT_HEX = "#e8e8e8";
const HAZE_DARK_HEX = "#4a4a4a";
const HAZE_LIGHT_OPACITY = 0.25;
const HAZE_DARK_OPACITY = 0.7;

function clampHazeIntensity(intensity: number): number {
  return Math.min(MAX_HAZE_INTENSITY, Math.max(MIN_HAZE_INTENSITY, intensity));
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((v) => Math.round(v).toString(16).padStart(2, "0"))
    .join("")}`;
}

export function getHazeColor(intensity: number): string {
  const n = clampHazeIntensity(intensity) / 100;
  const [lr, lg, lb] = hexToRgb(HAZE_LIGHT_HEX);
  const [dr, dg, db] = hexToRgb(HAZE_DARK_HEX);
  return rgbToHex(lr + (dr - lr) * n, lg + (dg - lg) * n, lb + (db - lb) * n);
}

export function getHazeOpacity(intensity: number): number {
  const n = clampHazeIntensity(intensity) / 100;
  return HAZE_LIGHT_OPACITY + (HAZE_DARK_OPACITY - HAZE_LIGHT_OPACITY) * n;
}

export interface FeelingEntrySummary {
  id: string;
  flowerColors: FlowerColorId[];
  feelingText: string;
  createdAt: string;
  hasHaze: boolean;
  hazeIntensity: number | null;
}
