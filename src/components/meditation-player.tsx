"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Play, Pause, RotateCcw, Volume2, FileText, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoiceSettings } from "@/lib/voice-settings";
import { VoiceSettingsPanel } from "@/components/voice-settings-panel";

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
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const startTimeRef = useRef<number>(0);
  const suppressNextEndRef = useRef(false);
  const audioErroredRef = useRef(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSeconds);
  const [settings, updateSettings, resetSettings] = useVoiceSettings();
  const [showSettings, setShowSettings] = useState(false);
  const [mode, setMode] = useState<"audio" | "tts" | "text">(
    audioUrl && settings.preferredEngine === "audio" ? "audio" : "tts"
  );
  const [showScript, setShowScript] = useState(false);

  // Check if browser TTS is available
  useEffect(() => {
    if (mode === "tts" && typeof window !== "undefined") {
      if (!window.speechSynthesis) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMode("text");
      }
    }
  }, [mode]);

  // Resync mode when user toggles preferredEngine in the settings panel.
  // Stops any current playback and switches engines.
  useEffect(() => {
    if (mode === "text") return;
    const next =
      audioUrl && settings.preferredEngine === "audio" && !audioErroredRef.current
        ? "audio"
        : "tts";
    if (next !== mode) {
      suppressNextEndRef.current = true;
      window.speechSynthesis?.cancel();
      suppressNextEndRef.current = false;
      if (audioRef.current) {
        audioRef.current.pause();
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsPlaying(false);
      setCurrentTime(0);
      setMode(next);
    }
  }, [settings.preferredEngine, audioUrl, mode]);

  // Reset audio-errored guard when a new audio URL arrives (new meditation loaded).
  useEffect(() => {
    audioErroredRef.current = false;
  }, [audioUrl]);

  // Clean up speech synthesis on unmount
  useEffect(() => {
    return () => {
      suppressNextEndRef.current = true;
      window.speechSynthesis?.cancel();
      suppressNextEndRef.current = false;
    };
  }, []);

  // Timer for TTS progress tracking
  useEffect(() => {
    if (mode !== "tts" || !isPlaying) return;
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      setCurrentTime(elapsed);
    }, 250);
    return () => clearInterval(interval);
  }, [mode, isPlaying]);

  // Audio element event listeners
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

    function handleError() {
      audioErroredRef.current = true;
      setMode("tts");
    }

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, [mode, handleTimeUpdate, handleLoadedMetadata, handleEnded]);

  // Apply user rate/volume to the audio element whenever they change.
  useEffect(() => {
    if (mode !== "audio" || !audioRef.current) return;
    audioRef.current.playbackRate = settings.rate;
    audioRef.current.volume = settings.volume;
  }, [mode, settings.rate, settings.volume]);

  function startTTS() {
    suppressNextEndRef.current = true;
    window.speechSynthesis.cancel();
    suppressNextEndRef.current = false;

    const utterance = new SpeechSynthesisUtterance(script);
    utterance.rate = settings.rate;
    utterance.pitch = settings.pitch;
    utterance.volume = settings.volume;
    utterance.lang = settings.lang;

    // Pick voice: stored voiceURI first, then heuristic fallback.
    const voices = window.speechSynthesis.getVoices();
    let chosen: SpeechSynthesisVoice | undefined;
    if (settings.voiceURI) {
      chosen = voices.find((v) => v.voiceURI === settings.voiceURI);
    }
    if (!chosen) {
      chosen = voices.find(
        (v) =>
          v.name.includes("Samantha") ||
          v.name.includes("Karen") ||
          v.name.includes("Google UK English Female") ||
          (v.lang.startsWith("en") && v.name.toLowerCase().includes("female"))
      );
    }
    if (chosen) utterance.voice = chosen;

    utterance.onend = () => {
      if (suppressNextEndRef.current) {
        suppressNextEndRef.current = false;
        return;
      }
      setIsPlaying(false);
      onComplete();
    };

    utteranceRef.current = utterance;
    startTimeRef.current = Date.now();
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
  }

  function togglePlay() {
    if (mode === "audio") {
      if (!audioRef.current) return;
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } else if (mode === "tts") {
      if (isPlaying) {
        window.speechSynthesis.pause();
        setIsPlaying(false);
      } else if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        startTimeRef.current = Date.now() - currentTime * 1000;
        setIsPlaying(true);
      } else {
        startTTS();
      }
    }
  }

  function restart() {
    if (mode === "audio") {
      if (!audioRef.current) return;
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    } else if (mode === "tts") {
      suppressNextEndRef.current = true;
      window.speechSynthesis.cancel();
      suppressNextEndRef.current = false;
      setCurrentTime(0);
      setIsPlaying(false);
      startTTS();
    }
  }

  function seekTo(e: React.MouseEvent<HTMLDivElement>) {
    if (mode !== "audio" || !audioRef.current) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pct = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = pct * duration;
  }

  const progress = duration > 0 ? Math.min(currentTime / duration, 1) : 0;

  function formatTime(seconds: number) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  }

  if (mode === "text") {
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
      {audioUrl && mode === "audio" && (
        <audio ref={audioRef} src={audioUrl} preload="metadata" />
      )}

      {/* Mode indicator */}
      {mode === "tts" && (
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Volume2 className="h-3.5 w-3.5" />
          <span>Using device voice</span>
        </div>
      )}

      {/* Ambient background */}
      <div className="relative flex h-48 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary/20 via-accent/10 to-primary/5">
        <div
          className={`absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent ${isPlaying ? "animate-pulse" : ""}`}
        />
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
          className={`h-2 rounded-full bg-muted ${mode === "audio" ? "cursor-pointer" : ""}`}
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
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowScript(!showScript)}
        >
          <FileText className="mr-1 h-4 w-4" />
          {showScript ? "Hide Text" : "Show Text"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowSettings(!showSettings)}
        >
          <Settings className="mr-1 h-4 w-4" />
          Voice
        </Button>
      </div>

      {showSettings && (
        <VoiceSettingsPanel
          settings={settings}
          onChange={updateSettings}
          onReset={resetSettings}
          currentMode={mode}
        />
      )}

      {/* Script text */}
      {showScript && (
        <div className="rounded-xl bg-card p-6">
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground/80">
            {script}
          </p>
        </div>
      )}
    </div>
  );
}
