import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { feelingEntries } from "@/db/schema";
import { NameItClient } from "./client";
import type { FeelingEntrySummary, FlowerColorId } from "@/lib/name-it-layout";

export default async function NameItPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const db = getDb();
  const rows = await db.query.feelingEntries.findMany({
    where: eq(feelingEntries.userId, userId),
    orderBy: [desc(feelingEntries.createdAt)],
  });

  const initialEntries: FeelingEntrySummary[] = rows.map((row) => ({
    id: row.id,
    flowerColors: row.flowerColors as FlowerColorId[],
    feelingText: row.feelingText,
    createdAt: row.createdAt.toISOString(),
    hasHaze: row.hasHaze,
    hazeIntensity: row.hazeIntensity,
  }));

  return <NameItClient initialEntries={initialEntries} />;
}
