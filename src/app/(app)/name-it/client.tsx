"use client";

import { useState, useTransition } from "react";
import { NameItHands } from "@/components/name-it-hands";
import { NameItFlowerTray } from "@/components/name-it-flower-tray";
import { NameItNamingStep } from "@/components/name-it-naming-step";
import { NameItHistory } from "@/components/name-it-history";
import { Button } from "@/components/ui/button";
import { saveFeelingEntry, deleteFeelingEntry } from "./actions";
import type { FeelingEntrySummary, FlowerColorId } from "@/lib/name-it-layout";

interface NameItClientProps {
  initialEntries: FeelingEntrySummary[];
}

type Phase = "building" | "naming" | "confirmation";

export function NameItClient({ initialEntries }: NameItClientProps) {
  const [flowers, setFlowers] = useState<FlowerColorId[]>([]);
  const [phase, setPhase] = useState<Phase>("building");
  const [feelingText, setFeelingText] = useState("");
  const [entries, setEntries] = useState(initialEntries);
  const [showHistory, setShowHistory] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);

  function handleAdd(color: FlowerColorId) {
    setFlowers((prev) => [...prev, color]);
  }

  function handleRemove(index: number) {
    setFlowers((prev) => prev.filter((_, i) => i !== index));
  }

  function handleClearFlowers() {
    setFlowers([]);
  }

  function handleSubmit() {
    const trimmed = feelingText.trim();
    if (!trimmed) return;
    setSaveError(null);
    startSaving(async () => {
      try {
        const entry = await saveFeelingEntry(flowers, trimmed);
        setEntries((prev) => [entry, ...prev]);
        setPhase("confirmation");
      } catch {
        // Bouquet and text are left untouched so the user can just retry.
        setSaveError("Couldn't save that — check your connection and try again.");
      }
    });
  }

  function handleReset() {
    setFlowers([]);
    setFeelingText("");
    setPhase("building");
  }

  async function handleDelete(id: string) {
    try {
      await deleteFeelingEntry(id);
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
    } catch {
      alert("Couldn't delete that entry — check your connection and try again.");
    }
  }

  if (showHistory) {
    return (
      <NameItHistory
        entries={entries}
        onBack={() => setShowHistory(false)}
        onDelete={handleDelete}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Name It</h1>
        <Button variant="outline" size="sm" onClick={() => setShowHistory(true)}>
          Past entries
        </Button>
      </div>

      <NameItHands flowers={flowers} onRemoveFlower={handleRemove} />

      {phase === "building" && (
        <div className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            {flowers.length === 0
              ? "What are you feeling right now? Add some flowers."
              : "Add more, or continue when you're ready."}
          </p>
          <NameItFlowerTray flowers={flowers} onAdd={handleAdd} />
          {flowers.length > 0 && (
            <div className="flex justify-center gap-3">
              <Button variant="outline" onClick={handleClearFlowers}>
                Clear
              </Button>
              <Button onClick={() => setPhase("naming")}>Continue</Button>
            </div>
          )}
        </div>
      )}

      {phase === "naming" && (
        <div className="space-y-3">
          <NameItNamingStep
            value={feelingText}
            onChange={setFeelingText}
            onSubmit={handleSubmit}
            isSaving={isSaving}
          />
          {saveError && (
            <p className="text-center text-sm text-destructive">{saveError}</p>
          )}
        </div>
      )}

      {phase === "confirmation" && (
        <div className="space-y-4 text-center">
          <p className="text-lg font-medium">
            You named this feeling &ldquo;{feelingText}&rdquo;
          </p>
          <Button onClick={handleReset}>Name another feeling</Button>
        </div>
      )}
    </div>
  );
}
