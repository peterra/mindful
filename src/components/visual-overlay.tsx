"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { DotVisual } from "@/components/dot-visual";
import { SineWaveVisual } from "@/components/sine-wave-visual";

interface VisualOverlayProps {
  style: "bloom" | "sine";
  paused: boolean;
  onTogglePause: () => void;
  onExit: () => void;
  speed: number;
}

export function VisualOverlay({
  style,
  paused,
  onTogglePause,
  onExit,
  speed,
}: VisualOverlayProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onExit();
      else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        onTogglePause();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onExit, onTogglePause]);

  return (
    <div
      className="fixed inset-0 z-50 cursor-pointer bg-background"
      onClick={onTogglePause}
      role="button"
      tabIndex={-1}
      aria-label={paused ? "Resume session" : "Pause session"}
    >
      {style === "bloom" ? (
        <DotVisual paused={paused} speed={speed} />
      ) : (
        <SineWaveVisual paused={paused} speed={speed} />
      )}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onExit();
        }}
        aria-label="Exit full-screen visual"
        className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/80 text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>

      {paused && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2 text-muted-foreground">
          <div className="flex h-12 w-12 items-center justify-center gap-1 rounded-full border border-border bg-card/80 backdrop-blur">
            <span className="h-4 w-1.5 rounded-full bg-foreground" />
            <span className="h-4 w-1.5 rounded-full bg-foreground" />
          </div>
          <span className="rounded-full border border-border bg-card/80 px-3 py-1 text-xs text-foreground backdrop-blur">
            Paused — tap to resume
          </span>
        </div>
      )}
    </div>
  );
}
