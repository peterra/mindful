"use server";

import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/db";
import { feelingEntries } from "@/db/schema";
import {
  isValidFlowerColors,
  type FlowerColorId,
  type FeelingEntrySummary,
} from "@/lib/name-it-layout";

export async function saveFeelingEntry(
  flowerColors: FlowerColorId[],
  feelingText: string
): Promise<FeelingEntrySummary> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const trimmed = feelingText.trim();
  if (!trimmed) throw new Error("Feeling text is required");
  if (trimmed.length > 200) throw new Error("Feeling text is too long");
  if (!isValidFlowerColors(flowerColors)) {
    throw new Error("Invalid flower selection");
  }

  const db = getDb();
  const [row] = await db
    .insert(feelingEntries)
    .values({ userId, flowerColors, feelingText: trimmed })
    .returning();

  return {
    id: row.id,
    flowerColors: row.flowerColors as FlowerColorId[],
    feelingText: row.feelingText,
    createdAt: row.createdAt.toISOString(),
  };
}
