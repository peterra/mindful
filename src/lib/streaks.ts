import { getDb } from "@/db";
import { streaks } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function updateStreak(userId: string) {
  const db = getDb();
  const today = new Date().toISOString().split("T")[0];

  const streak = await db.query.streaks.findFirst({
    where: eq(streaks.userId, userId),
  });

  if (!streak) {
    // First session ever
    await db.insert(streaks).values({
      userId,
      currentStreak: 1,
      longestStreak: 1,
      lastSessionDate: today,
      freezeAvailable: false,
    });
    return;
  }

  const lastDate = streak.lastSessionDate;

  if (lastDate === today) {
    // Already meditated today, no change
    return;
  }

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split("T")[0];

  let newStreak = streak.currentStreak;
  let newFreeze = streak.freezeAvailable;

  if (lastDate === yesterdayStr) {
    // Consecutive day
    newStreak += 1;
  } else {
    // Missed a day — check if freeze available
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const twoDaysAgoStr = twoDaysAgo.toISOString().split("T")[0];

    if (lastDate === twoDaysAgoStr && streak.freezeAvailable) {
      // Use the freeze
      newStreak += 1;
      newFreeze = false;
    } else {
      // Streak broken
      newStreak = 1;
    }
  }

  const newLongest = Math.max(streak.longestStreak, newStreak);

  // Earn a freeze every 7-day streak
  if (newStreak > 0 && newStreak % 7 === 0) {
    newFreeze = true;
  }

  await db
    .update(streaks)
    .set({
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastSessionDate: today,
      freezeAvailable: newFreeze,
    })
    .where(eq(streaks.userId, userId));
}
