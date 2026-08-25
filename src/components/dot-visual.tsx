"use client";

import { useEffect, useRef } from "react";

const BASE_DURATION_MS = 7200;
const MIN_DIAMETER_FRACTION = 0.015;
const MIN_DIAMETER_PX = 3;
const MAX_DIAMETER_MULTIPLE = 2.6;
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

interface DotVisualProps {
  paused: boolean;
  speed: number;
}

export function DotVisual({ paused, speed }: DotVisualProps) {
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
        const base = Math.max(
          MIN_DIAMETER_PX,
          Math.min(w, h) * MIN_DIAMETER_FRACTION
        );
        const max = Math.sqrt(w * w + h * h) * MAX_DIAMETER_MULTIPLE;

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

  return (
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
  );
}
