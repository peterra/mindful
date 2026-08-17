"use client";

import { MIN_HAZE_INTENSITY, MAX_HAZE_INTENSITY } from "@/lib/name-it-layout";

interface NameItHazeSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function NameItHazeSlider({ value, onChange }: NameItHazeSliderProps) {
  return (
    <div className="mx-auto flex max-w-xs flex-col items-center gap-2">
      <p className="text-xs text-muted-foreground">Haze</p>
      <input
        type="range"
        min={MIN_HAZE_INTENSITY}
        max={MAX_HAZE_INTENSITY}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Haze intensity"
        className="w-full accent-foreground"
      />
      <div className="flex w-full justify-between text-[10px] text-muted-foreground">
        <span>Lighter</span>
        <span>Darker</span>
      </div>
    </div>
  );
}
