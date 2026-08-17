"use client";

import { Cloud } from "lucide-react";
import { FLOWER_COLORS, MAX_FLOWERS, type FlowerColorId } from "@/lib/name-it-layout";
import { cn } from "@/lib/utils";

interface NameItFlowerTrayProps {
  flowers: FlowerColorId[];
  onAdd: (color: FlowerColorId) => void;
  hasHaze: boolean;
  onToggleHaze: () => void;
}

export function NameItFlowerTray({
  flowers,
  onAdd,
  hasHaze,
  onToggleHaze,
}: NameItFlowerTrayProps) {
  const atCap = flowers.length >= MAX_FLOWERS;

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm text-muted-foreground">
        {atCap ? "Your bouquet is full" : "Tap a color to add a flower"}
      </p>
      <div className="flex gap-3 rounded-full bg-card px-4 py-3 shadow-sm">
        {FLOWER_COLORS.map((color) => (
          <button
            key={color.id}
            type="button"
            aria-label={`Add a ${color.label.toLowerCase()} flower`}
            disabled={atCap}
            onClick={() => onAdd(color.id)}
            className="h-8 w-8 rounded-full ring-offset-2 transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
            style={{ backgroundColor: color.hex }}
          />
        ))}
        <button
          type="button"
          aria-label={hasHaze ? "Remove haze" : "Add haze"}
          aria-pressed={hasHaze}
          onClick={onToggleHaze}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-transform hover:scale-110",
            hasHaze && "border-foreground bg-muted text-foreground"
          )}
        >
          <Cloud className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
