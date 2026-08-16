"use client";

import { FLOWER_COLORS, MAX_FLOWERS, type FlowerColorId } from "@/lib/name-it-layout";

interface NameItFlowerTrayProps {
  flowers: FlowerColorId[];
  onAdd: (color: FlowerColorId) => void;
}

export function NameItFlowerTray({ flowers, onAdd }: NameItFlowerTrayProps) {
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
      </div>
    </div>
  );
}
