export const VISUALIZATION_STYLES = ["bloom", "sine"] as const;
export type VisualizationStyle = (typeof VISUALIZATION_STYLES)[number];

export const MIN_PRESET_SPEED = 0.01;
export const MAX_PRESET_SPEED = 2;

export interface VisualizationPresetSummary {
  id: string;
  name: string;
  style: VisualizationStyle;
  speed: number;
  createdAt: string;
}

export function isValidVisualizationStyle(
  style: unknown
): style is VisualizationStyle {
  return (
    typeof style === "string" &&
    (VISUALIZATION_STYLES as readonly string[]).includes(style)
  );
}

export function isValidPresetName(name: unknown): name is string {
  return typeof name === "string" && name.trim().length > 0;
}

export function isValidPresetSpeed(speed: unknown): speed is number {
  return (
    typeof speed === "number" &&
    Number.isFinite(speed) &&
    speed >= MIN_PRESET_SPEED &&
    speed <= MAX_PRESET_SPEED
  );
}
