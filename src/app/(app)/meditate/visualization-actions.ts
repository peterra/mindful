"use server";

import { auth } from "@clerk/nextjs/server";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { visualizationPresets } from "@/db/schema";
import {
  isValidPresetName,
  isValidPresetSpeed,
  isValidVisualizationStyle,
  type VisualizationPresetSummary,
  type VisualizationStyle,
} from "@/lib/visualization-presets";

function toSummary(
  row: typeof visualizationPresets.$inferSelect
): VisualizationPresetSummary {
  return {
    id: row.id,
    name: row.name,
    style: row.style as VisualizationStyle,
    speed: row.speed,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listVisualizationPresets(): Promise<
  VisualizationPresetSummary[]
> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const db = getDb();
  const rows = await db.query.visualizationPresets.findMany({
    where: eq(visualizationPresets.userId, userId),
    orderBy: [desc(visualizationPresets.createdAt)],
  });

  return rows.map(toSummary);
}

export async function saveVisualizationPreset(
  name: string,
  style: VisualizationStyle,
  speed: number
): Promise<VisualizationPresetSummary> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const trimmed = typeof name === "string" ? name.trim() : "";
  if (!isValidPresetName(trimmed)) throw new Error("Preset name is required");
  if (!isValidVisualizationStyle(style)) {
    throw new Error("Invalid visualization style");
  }
  if (!isValidPresetSpeed(speed)) throw new Error("Invalid visualization speed");

  const db = getDb();
  const [row] = await db
    .insert(visualizationPresets)
    .values({ userId, name: trimmed, style, speed })
    .returning();

  return toSummary(row);
}

export async function deleteVisualizationPreset(id: string): Promise<void> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const db = getDb();
  await db
    .delete(visualizationPresets)
    .where(
      and(
        eq(visualizationPresets.id, id),
        eq(visualizationPresets.userId, userId)
      )
    );
}
