"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

const BASE_DURATION_MS = 7200;
const MIN_DIAMETER_FRACTION = 0.015;
const MIN_DIAMETER_PX = 3;
const MAX_DIAMETER_MULTIPLE = 1.35;
const DOT_GRADIENT =
  "radial-gradient(circle at 50% 50%, var(--muted-foreground) 0%, var(--muted-foreground) 55%, transparent 78%)";

function ease(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Each layer is fully invisible for the second half of its own cycle (it's
// still growing back there, just unseen) so its phase partner's small,
// just-emerging dot is never masked by an already-large overlapping one —
// every repeat reads as coming from far away, not just the first.
function fadeEnvelope(t: number, inEnd = 0.06, outStart = 0.32, outEnd = 0.5) {
  if (t < inEnd) return t / inEnd;
  if (t < outStart) return 1;
  if (t < outEnd) return Math.max(0, 1 - (t - outStart) / (outEnd - outStart));
  return 0;
}

interface BreathingDotOverlayProps {
  paused: boolean;
  onTogglePause: () => void;
  onExit: () => void;
  speed: number;
}

export function BreathingDotOverlay({
  paused,
  onTogglePause,
  onExit,
  speed,
}: BreathingDotOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const layerARef = useRef<HTMLDivElement>(null);
  const layerBRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);
  const pausedAtRef = useRef(0);
  const pausedRef = useRef(paused);
  const speedRef = useRef(speed);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  // Shift the animation clock across pause/resume so the cycle continues
  // where it left off instead of jumping ahead by the paused duration.
  useEffect(() => {
    if (paused) {
      pausedAtRef.current = performance.now();
    } else if (pausedAtRef.current) {
      startTimeRef.current += performance.now() - pausedAtRef.current;
      pausedAtRef.current = 0;
    }
  }, [paused]);

  useEffect(() => {
    const container = containerRef.current;
    const layers = [layerARef.current, layerBRef.current];
    if (!container || !layers[0] || !layers[1]) return;

    startTimeRef.current = performance.now();

    function tick() {
      if (!pausedRef.current) {
        const duration = BASE_DURATION_MS / speedRef.current;
        const elapsed = performance.now() - startTimeRef.current;
        const w = container!.clientWidth;
        const h = container!.clientHeight;
        const base = Math.max(MIN_DIAMETER_PX, Math.min(w, h) * MIN_DIAMETER_FRACTION);
        const max = Math.sqrt(w * w + h * h) * MAX_DIAMETER_MULTIPLE;

        // Each layer waits out its phase delay before starting its own cycle
        // from scratch, so both begin small on open instead of one layer
        // appearing already mid-grown.
        [0, 0.5].forEach((phase, i) => {
          const localElapsed = elapsed - phase * duration;
          const el = layers[i]!;
          if (localElapsed < 0) {
            el.style.width = `${base}px`;
            el.style.height = `${base}px`;
            el.style.opacity = "0";
            return;
          }
          const t = (localElapsed / duration) % 1;
          const diameter = base + (max - base) * ease(t);
          el.style.width = `${diameter}px`;
          el.style.height = `${diameter}px`;
          el.style.opacity = String(fadeEnvelope(t));
        });
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

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
      <div ref={containerRef} className="absolute inset-0 overflow-hidden">
        <div
          ref={layerARef}
          className="absolute rounded-full opacity-0"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: DOT_GRADIENT,
          }}
        />
        <div
          ref={layerBRef}
          className="absolute rounded-full opacity-0"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: DOT_GRADIENT,
          }}
        />
      </div>

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
