import textToSpeech from "@google-cloud/text-to-speech";
import { put } from "@vercel/blob";
import { getDb } from "@/db";
import { meditations } from "@/db/schema";
import { eq } from "drizzle-orm";

const VOICE_MAP: Record<string, { name: string; languageCode: string }> = {
  shimmer: { name: "en-US-Journey-F", languageCode: "en-US" },
  nova: { name: "en-US-Journey-D", languageCode: "en-US" },
};

function getClient() {
  return new textToSpeech.TextToSpeechClient();
}

export async function generateMeditationAudio(
  meditationId: string,
  script: string,
  voice: string = "shimmer"
) {
  const client = getClient();
  const voiceConfig = VOICE_MAP[voice] ?? VOICE_MAP.shimmer;

  const [response] = await client.synthesizeSpeech({
    input: { text: script },
    voice: {
      languageCode: voiceConfig.languageCode,
      name: voiceConfig.name,
    },
    audioConfig: {
      audioEncoding: "MP3",
      speakingRate: 0.9,
      pitch: -1.0,
    },
  });

  if (!response.audioContent) {
    throw new Error("No audio content returned from Google TTS");
  }

  const audioBuffer = Buffer.from(response.audioContent as Uint8Array);

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
