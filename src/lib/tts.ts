import OpenAI from "openai";
import { put } from "@vercel/blob";
import { getDb } from "@/db";
import { meditations } from "@/db/schema";
import { eq } from "drizzle-orm";

const openai = new OpenAI();

export async function generateMeditationAudio(
  meditationId: string,
  script: string,
  voice: string = "shimmer"
) {
  const response = await openai.audio.speech.create({
    model: "tts-1-hd",
    voice: voice as "shimmer" | "nova" | "alloy" | "echo" | "fable" | "onyx",
    input: script,
  });

  const audioBuffer = Buffer.from(await response.arrayBuffer());

  // Upload to Vercel Blob
  const blob = await put(`meditations/${meditationId}.mp3`, audioBuffer, {
    access: "public",
    contentType: "audio/mpeg",
  });

  // Update the meditation record with the audio URL
  const db = getDb();
  await db
    .update(meditations)
    .set({ audioUrl: blob.url })
    .where(eq(meditations.id, meditationId));

  return blob.url;
}
