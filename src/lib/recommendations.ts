import { getDb } from "@/db";
import { meditations, sessions, users } from "@/db/schema";
import { eq, and, notInArray, sql } from "drizzle-orm";

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

  // Find a meditation matching preferences, excluding recent ones
  const candidates = await db.query.meditations.findMany({
    where: and(
      user.focusAreas && user.focusAreas.length > 0
        ? sql`${meditations.category} = ANY(${user.focusAreas})`
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
