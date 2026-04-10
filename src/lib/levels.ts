export const LEVELS = [
  { name: "Beginner", minSessions: 0 },
  { name: "Novice", minSessions: 10 },
  { name: "Practitioner", minSessions: 25 },
  { name: "Adept", minSessions: 50 },
  { name: "Mindful", minSessions: 100 },
] as const;

type Level = (typeof LEVELS)[number];

export function getLevel(totalSessions: number) {
  let current: Level = LEVELS[0];
  let next: Level | null = LEVELS[1];

  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (totalSessions >= LEVELS[i].minSessions) {
      current = LEVELS[i];
      next = LEVELS[i + 1] ?? null;
      break;
    }
  }

  const progress = next
    ? (totalSessions - current.minSessions) /
      (next.minSessions - current.minSessions)
    : 1;

  return { current, next, progress: Math.min(progress, 1) };
}
