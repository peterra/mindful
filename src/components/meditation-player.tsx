"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Play, Pause, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface MeditationPlayerProps {
  audioUrl: string | null;
  script: string;
  durationSeconds: number;
  onComplete: () => void;
}

export function MeditationPlayer({
  audioUrl,
  script,
  durationSeconds,
  onComplete,
}: MeditationPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSeconds);
  const [showTextFallback, setShowTextFallback] = useState(!audioUrl);

  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  }, []);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", () => setShowTextFallback(true));

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", () => setShowTextFallback(true));
    };
  }, [handleTimeUpdate, handleLoadedMetadata, handleEnded]);

  function togglePlay() {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }

  function restart() {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    setCurrentTime(0);
  }

  function seekTo(e: React.MouseEvent<HTMLDivElement>) {
    if (!audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pct * duration;
  }

  const progress = duration > 0 ? currentTime / duration : 0;

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  if (showTextFallback) {
    return (
      <div className="space-y-6">
        <div className="rounded-xl bg-card p-6">
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/80">
            {script}
          </p>
        </div>
        <Button onClick={onComplete} className="w-full">
          Mark as Complete
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {audioUrl && <audio ref={audioRef} src={audioUrl} preload="metadata" />}

      {/* Ambient background */}
      <div className="relative flex h-48 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5">
        <div className="absolute inset-0 animate-pulse bg-gradient-to-t from-primary/5 to-transparent" />
        <Button
          size="lg"
          onClick={togglePlay}
          className="relative z-10 h-16 w-16 rounded-full"
        >
          {isPlaying ? (
            <Pause className="h-6 w-6" />
          ) : (
            <Play className="h-6 w-6 pl-0.5" />
          )}
        </Button>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div
          className="h-2 cursor-pointer rounded-full bg-muted"
          onClick={seekTo}
        >
          <div
            className="h-2 rounded-full bg-primary transition-all"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4">
        <Button variant="outline" size="sm" onClick={restart}>
          <RotateCcw className="mr-1 h-4 w-4" />
          Restart
        </Button>
      </div>
    </div>
  );
}
