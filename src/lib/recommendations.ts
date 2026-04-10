import { getDb } from "@/db";
import { meditations, sessions, users } from "@/db/schema";
import { eq, and, notInArray, inArray, sql } from "drizzle-orm";

// Map onboarding focus areas to actual meditation categories
const FOCUS_TO_CATEGORIES: Record<string, string[]> = {
  stress: ["stress"],
  focus: ["focus"],
  sleep: ["sleep"],
  emotional: ["loving_kindness", "body_scan"],
  general: ["breath", "morning", "body_scan"],
};

function resolveCategories(focusAreas: string[]): string[] {
  const categories = new Set<string>();
  for (const area of focusAreas) {
    const mapped = FOCUS_TO_CATEGORIES[area];
    if (mapped) {
      for (const cat of mapped) categories.add(cat);
    }
  }
  return [...categories];
}

export async function getRecommendedMeditation(userId: string) {
  const db = getDb();

  // Get user preferences
  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
  });

  if (!user) return null;

  // Get sessions from last 3 days
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const recentSessions = await db
    .select({ meditationId: sessions.meditationId })
    .from(sessions)
    .where(
      and(
        eq(sessions.userId, userId),
        sql`${sessions.completedAt} > ${threeDaysAgo.toISOString()}`
      )
    );

  const recentMeditationIds = recentSessions.map((s) => s.meditationId);

  // Map focus areas to valid DB categories
  const dbCategories =
    user.focusAreas && user.focusAreas.length > 0
      ? resolveCategories(user.focusAreas)
      : [];

  // Find a meditation matching preferences, excluding recent ones
  const candidates = await db.query.meditations.findMany({
    where: and(
      dbCategories.length > 0
        ? inArray(meditations.category, dbCategories as [string, ...string[]])
        : undefined,
      recentMeditationIds.length > 0
        ? notInArray(meditations.id, recentMeditationIds)
        : undefined
    ),
  });

  if (candidates.length === 0) {
    // Fallback: any meditation at preferred duration
    const fallback = await db.query.meditations.findFirst({
      where: recentMeditationIds.length > 0
        ? notInArray(meditations.id, recentMeditationIds)
        : undefined,
    });
    return fallback ?? (await db.query.meditations.findFirst());
  }

  // Prefer meditations close to preferred duration
  const preferredSeconds = (user.preferredDuration ?? 5) * 60;
  candidates.sort(
    (a, b) =>
      Math.abs(a.durationSeconds - preferredSeconds) -
      Math.abs(b.durationSeconds - preferredSeconds)
  );

  // Pick randomly from top 3 closest matches
  const top = candidates.slice(0, 3);
  return top[Math.floor(Math.random() * top.length)];
}
