"use server";

import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/db";
import { sessions, streaks, achievements, meditations } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { generateMeditationAudio } from "@/lib/tts";
import { checkAndAwardAchievements } from "@/lib/achievements";
import { updateStreak } from "@/lib/streaks";
import { revalidatePath } from "next/cache";

export async function completeSession(
  meditationId: string,
  durationSeconds: number,
  moodBefore: number,
  moodAfter: number,
  journalNote: string
) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const db = getDb();

  // Save the session
  await db.insert(sessions).values({
    userId,
    meditationId,
    durationSeconds,
    moodBefore,
    moodAfter,
    journalNote: journalNote || null,
  });

  // Update streak
  await updateStreak(userId);

  // Check achievements
  await checkAndAwardAchievements(userId);

  revalidatePath("/dashboard");
  revalidatePath("/progress");
}

export async function ensureAudio(meditationId: string) {
  const db = getDb();
  const meditation = await db.query.meditations.findFirst({
    where: eq(meditations.id, meditationId),
  });

  if (!meditation) throw new Error("Meditation not found");
  if (meditation.audioUrl) return meditation.audioUrl;

  // Generate audio
  const audioUrl = await generateMeditationAudio(
    meditationId,
    meditation.script,
    meditation.voice ?? "shimmer"
  );

  return audioUrl;
}
