"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MeditationPlayer } from "@/components/meditation-player";
import { PostSession } from "@/components/post-session";
import { AdminRecordingControls } from "@/components/admin-recording-controls";
import { completeSession, ensureAudio } from "./actions";

interface MeditateClientProps {
  meditationId: string;
  audioUrl: string | null;
  script: string;
  durationSeconds: number;
  admin: boolean;
  hasRecording: boolean;
}

export function MeditateClient({
  meditationId,
  audioUrl,
  script,
  durationSeconds,
  admin,
  hasRecording,
}: MeditateClientProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<"playing" | "reflection">("playing");
  const [generatedAudioUrl, setGeneratedAudioUrl] = useState<string | null>(null);
  const playerAudioUrl = audioUrl ?? generatedAudioUrl;

  useEffect(() => {
    if (!audioUrl) {
      ensureAudio(meditationId)
        .then(setGeneratedAudioUrl)
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
    <>
      <MeditationPlayer
        audioUrl={playerAudioUrl}
        script={script}
        durationSeconds={durationSeconds}
        onComplete={handleComplete}
      />
      {admin && (
        <AdminRecordingControls
          meditationId={meditationId}
          hasRecording={hasRecording}
        />
      )}
    </>
  );
}
