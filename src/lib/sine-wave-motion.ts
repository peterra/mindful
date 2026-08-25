export const MIN_SPEED = 0.1;
export const MAX_SPEED = 3;
export const LERP_FACTOR = 0.06;

export function lerp(current: number, target: number, factor: number): number {
  return current + (target - current) * factor;
}

export function targetSpeedFromMouseX(
  mouseX: number,
  width: number,
  minSpeed: number = MIN_SPEED,
  maxSpeed: number = MAX_SPEED
): number {
  if (width <= 0) return minSpeed;
  const frac = Math.min(1, Math.max(0, mouseX / width));
  return minSpeed + frac * (maxSpeed - minSpeed);
}
