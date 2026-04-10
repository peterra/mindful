"use server";

import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/db";
import { users, streaks } from "@/db/schema";
import { redirect } from "next/navigation";

export async function saveOnboarding(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const experienceLevel = formData.get("experienceLevel") as
    | "beginner"
    | "some_experience"
    | "regular";
  const focusAreas = formData.getAll("focusAreas") as string[];
  const preferredDuration = parseInt(
    formData.get("preferredDuration") as string,
    10
  );

  const db = getDb();

  await db
    .insert(users)
    .values({
      clerkId: userId,
      experienceLevel,
      focusAreas,
      preferredDuration,
      preferredVoice: "shimmer",
    })
    .onConflictDoUpdate({
      target: users.clerkId,
      set: {
        experienceLevel,
        focusAreas,
        preferredDuration,
        updatedAt: new Date(),
      },
    });

  // Initialize streaks record
  await db
    .insert(streaks)
    .values({
      userId,
      currentStreak: 0,
      longestStreak: 0,
      freezeAvailable: false,
    })
    .onConflictDoNothing();

  redirect("/dashboard");
}
