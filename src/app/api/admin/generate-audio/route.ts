import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/db";
import { meditations } from "@/db/schema";
import { isNull } from "drizzle-orm";
import { generateMeditationAudio } from "@/lib/tts";

export async function POST() {
  const { userId } = await auth();
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const pending = await db.query.meditations.findMany({
    where: isNull(meditations.audioUrl),
  });

  const results: { id: string; title: string; status: string }[] = [];

  for (const meditation of pending) {
    try {
      await generateMeditationAudio(
        meditation.id,
        meditation.script,
        meditation.voice ?? "shimmer"
      );
      results.push({
        id: meditation.id,
        title: meditation.title,
        status: "success",
      });
    } catch (error) {
      results.push({
        id: meditation.id,
        title: meditation.title,
        status: `failed: ${error instanceof Error ? error.message : "unknown"}`,
      });
    }
  }

  return Response.json({
    total: pending.length,
    results,
  });
}
