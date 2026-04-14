import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { getDb } from "@/db";
import { meditations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { MeditateClient } from "./client";
import { isAdmin } from "@/lib/admin";

const CATEGORY_LABELS: Record<string, string> = {
  breath: "Breath Awareness",
  body_scan: "Body Scan",
  stress: "Stress Relief",
  focus: "Focus",
  sleep: "Sleep",
  loving_kindness: "Loving-Kindness",
  morning: "Morning",
};

export default async function MeditatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await params;
  const db = getDb();
  const meditation = await db.query.meditations.findFirst({
    where: eq(meditations.id, id),
  });

  if (!meditation) notFound();

  const audioSrc = meditation.recordedAudioUrl ?? meditation.audioUrl;
  const admin = isAdmin(userId);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {CATEGORY_LABELS[meditation.category] ?? meditation.category}
          </Badge>
          <Badge variant="outline">
            {Math.round(meditation.durationSeconds / 60)} min
          </Badge>
        </div>
        <h1 className="mt-2 text-2xl font-bold">{meditation.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {meditation.description}
        </p>
      </div>

      <MeditateClient
        meditationId={meditation.id}
        audioUrl={audioSrc}
        script={meditation.script}
        durationSeconds={meditation.durationSeconds}
        admin={admin}
        hasRecording={!!meditation.recordedAudioUrl}
      />
    </div>
  );
}
