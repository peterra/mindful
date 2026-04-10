"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MeditationPlayer } from "@/components/meditation-player";
import { PostSession } from "@/components/post-session";
import { completeSession, ensureAudio } from "./actions";

interface MeditateClientProps {
  meditationId: string;
  audioUrl: string | null;
  script: string;
  durationSeconds: number;
}

export function MeditateClient({
  meditationId,
  audioUrl,
  script,
  durationSeconds,
}: MeditateClientProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<"playing" | "reflection">("playing");
  const [resolvedAudioUrl, setResolvedAudioUrl] = useState(audioUrl);

  // Try to generate audio on mount if missing
  useEffect(() => {
    if (!audioUrl) {
      ensureAudio(meditationId)
        .then(setResolvedAudioUrl)
        .catch(() => {
          // Will fall back to text display
        });
    }
  }, [audioUrl, meditationId]);

  const handleComplete = useCallback(() => {
    setPhase("reflection");
  }, []);

  async function handleReflectionSubmit(data: {
    moodBefore: number;
    moodAfter: number;
    journalNote: string;
  }) {
    await completeSession(
      meditationId,
      durationSeconds,
      data.moodBefore,
      data.moodAfter,
      data.journalNote
    );
    router.push("/dashboard");
  }

  if (phase === "reflection") {
    return <PostSession onSubmit={handleReflectionSubmit} />;
  }

  return (
    <MeditationPlayer
      audioUrl={resolvedAudioUrl}
      script={script}
      durationSeconds={durationSeconds}
      onComplete={handleComplete}
    />
  );
}
