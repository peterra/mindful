"use client";

import { useEffect, useRef } from "react";
import { lerp, targetSpeedFromMouseX, LERP_FACTOR } from "@/lib/sine-wave-motion";

const WAVE_COUNT = 3; // how many full crests are visible across the width
const AMPLITUDE_FRACTION = 0.12; // of viewport height
const BASE_CYCLES_PER_SECOND = 0.15; // scroll rate at speed = 1
const FALLBACK_STROKE_COLOR = "oklch(0.5 0.02 250)";

interface SineWaveVisualProps {
  paused: boolean;
  speed: number;
}

export function SineWaveVisual({ paused, speed }: SineWaveVisualProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef(0);
  const phaseRef = useRef(0);
  const currentSpeedRef = useRef(speed);
  const mouseInsideRef = useRef(false);
  const mouseXRef = useRef(0);
  const pausedRef = useRef(paused);
  const speedRef = useRef(speed);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function handleMouseMove(e: MouseEvent) {
      mouseInsideRef.current = true;
      mouseXRef.current = e.clientX;
    }
    function handleMouseLeave() {
      mouseInsideRef.current = false;
    }
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    lastFrameRef.current = performance.now();

    function tick(now: number) {
      const elapsedMs = now - lastFrameRef.current;
      lastFrameRef.current = now;

      const width = canvas!.width;
      const height = canvas!.height;

      if (!pausedRef.current && width > 0) {
        const target = mouseInsideRef.current
          ? targetSpeedFromMouseX(mouseXRef.current, width)
          : speedRef.current;
        currentSpeedRef.current = lerp(
          currentSpeedRef.current,
          target,
          LERP_FACTOR
        );
        phaseRef.current +=
          (elapsedMs / 1000) *
          currentSpeedRef.current *
          BASE_CYCLES_PER_SECOND *
          Math.PI *
          2;
      }

      ctx!.clearRect(0, 0, width, height);

      if (width > 0) {
        const amplitude = height * AMPLITUDE_FRACTION;
        const centerY = height / 2;
        const frequency = (2 * Math.PI * WAVE_COUNT) / width;
        const strokeColor =
          getComputedStyle(document.documentElement)
            .getPropertyValue("--muted-foreground")
            .trim() || FALLBACK_STROKE_COLOR;

        ctx!.beginPath();
        ctx!.lineWidth = 2;
        ctx!.strokeStyle = strokeColor;
        for (let x = 0; x <= width; x += 4) {
          const y = centerY + amplitude * Math.sin(x * frequency + phaseRef.current);
          if (x === 0) ctx!.moveTo(x, y);
          else ctx!.lineTo(x, y);
        }
        ctx!.stroke();
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0" />;
}
