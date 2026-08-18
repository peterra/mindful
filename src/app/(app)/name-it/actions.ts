"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { feelingEntries } from "@/db/schema";
import {
  isValidFlowerColors,
  isValidHazeIntensity,
  isSaveableEntry,
  type FlowerColorId,
  type FeelingEntrySummary,
} from "@/lib/name-it-layout";

export async function saveFeelingEntry(
  flowerColors: FlowerColorId[],
  feelingText: string,
  hasHaze: boolean,
  hazeIntensity: number | null
): Promise<FeelingEntrySummary> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const trimmed = feelingText.trim();
  if (!trimmed) throw new Error("Feeling text is required");
  if (trimmed.length > 200) throw new Error("Feeling text is too long");
  if (!isValidFlowerColors(flowerColors)) {
    throw new Error("Invalid flower selection");
  }
  if (typeof hasHaze !== "boolean") {
    throw new Error("Invalid haze flag");
  }
  if (!isSaveableEntry(flowerColors.length, hasHaze)) {
    throw new Error("Add at least a flower or haze before saving");
  }
  if (!isValidHazeIntensity(hasHaze, hazeIntensity)) {
    throw new Error("Invalid haze intensity");
  }

  const db = getDb();
  const [row] = await db
    .insert(feelingEntries)
    .values({
      userId,
      flowerColors,
      feelingText: trimmed,
      hasHaze,
      hazeIntensity: hasHaze ? hazeIntensity : null,
    })
    .returning();

  return {
    id: row.id,
    flowerColors: row.flowerColors as FlowerColorId[],
    feelingText: row.feelingText,
    createdAt: row.createdAt.toISOString(),
    hasHaze: row.hasHaze,
    hazeIntensity: row.hazeIntensity,
  };
}

export async function deleteFeelingEntry(id: string): Promise<void> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const db = getDb();
  await db
    .delete(feelingEntries)
    .where(and(eq(feelingEntries.id, id), eq(feelingEntries.userId, userId)));
}
