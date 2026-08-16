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
    colors.length >= 1 &&
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

export interface FeelingEntrySummary {
  id: string;
  flowerColors: FlowerColorId[];
  feelingText: string;
  createdAt: string;
}
