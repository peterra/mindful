"use client";

import { Cloud, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FLOWER_COLORS, type FeelingEntrySummary } from "@/lib/name-it-layout";

interface NameItHistoryProps {
  entries: FeelingEntrySummary[];
  onBack: () => void;
  onDelete: (id: string) => void;
}

function formatTimestamp(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function NameItHistory({ entries, onBack, onDelete }: NameItHistoryProps) {
  function handleDelete(id: string) {
    if (!confirm("Delete this entry? This can't be undone.")) return;
    onDelete(id);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Past entries</h1>
        <Button variant="outline" size="sm" onClick={onBack}>
          Back
        </Button>
      </div>
      {entries.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground">
          Nothing named yet — try adding your first flower.
        </p>
      ) : (
        <ul className="space-y-3">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
            >
              <div className="flex -space-x-1">
                {entry.flowerColors.map((colorId, i) => {
                  const color = FLOWER_COLORS.find((c) => c.id === colorId);
                  return (
                    <span
                      key={i}
                      className="h-4 w-4 rounded-full ring-2 ring-card"
                      style={{ backgroundColor: color?.hex }}
                    />
                  );
                })}
                {entry.hasHaze && (
                  <span
                    aria-label="Had haze"
                    className="flex h-4 w-4 items-center justify-center rounded-full bg-muted ring-2 ring-card"
                  >
                    <Cloud className="h-2.5 w-2.5 text-muted-foreground" />
                  </span>
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{entry.feelingText}</p>
                <p className="text-xs text-muted-foreground">
                  {formatTimestamp(entry.createdAt)}
                </p>
              </div>
              <button
                type="button"
                aria-label="Delete entry"
                onClick={() => handleDelete(entry.id)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
