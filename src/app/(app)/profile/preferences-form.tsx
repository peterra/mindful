"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { updatePreferences } from "./actions";

const FOCUS_AREAS = [
  { value: "stress", label: "Stress Relief" },
  { value: "focus", label: "Focus & Clarity" },
  { value: "sleep", label: "Better Sleep" },
  { value: "emotional", label: "Emotional Balance" },
  { value: "general", label: "General Wellness" },
];

const DURATIONS = [
  { value: 3, label: "3 min" },
  { value: 5, label: "5 min" },
  { value: 10, label: "10 min" },
  { value: 15, label: "15 min" },
  { value: 20, label: "20 min" },
];

const VOICES = [
  { value: "shimmer", label: "Shimmer", description: "Warm and calm" },
  { value: "nova", label: "Nova", description: "Clear and gentle" },
];

interface PreferencesFormProps {
  focusAreas: string[];
  preferredDuration: number;
  preferredVoice: string;
}

export function PreferencesForm({
  focusAreas: initialFocus,
  preferredDuration: initialDuration,
  preferredVoice: initialVoice,
}: PreferencesFormProps) {
  const [focusAreas, setFocusAreas] = useState(initialFocus);
  const [duration, setDuration] = useState(initialDuration);
  const [voice, setVoice] = useState(initialVoice);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  function toggleFocus(value: string) {
    setFocusAreas((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
    setSaved(false);
  }

  async function handleSave() {
    setIsSaving(true);
    const formData = new FormData();
    for (const area of focusAreas) {
      formData.append("focusAreas", area);
    }
    formData.set("preferredDuration", String(duration));
    formData.set("preferredVoice", voice);
    await updatePreferences(formData);
    setIsSaving(false);
    setSaved(true);
  }

  return (
    <div className="space-y-6">
      {/* Focus areas */}
      <div>
        <label className="mb-2 block text-sm font-medium">Focus Areas</label>
        <div className="flex flex-wrap gap-2">
          {FOCUS_AREAS.map((area) => (
            <button
              key={area.value}
              type="button"
              onClick={() => toggleFocus(area.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm transition-colors",
                focusAreas.includes(area.value)
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/50"
              )}
            >
              {area.label}
            </button>
          ))}
        </div>
      </div>

      {/* Duration */}
      <div>
        <label className="mb-2 block text-sm font-medium">
          Preferred Duration
        </label>
        <div className="flex gap-2">
          {DURATIONS.map((d) => (
            <button
              key={d.value}
              type="button"
              onClick={() => {
                setDuration(d.value);
                setSaved(false);
              }}
              className={cn(
                "rounded-lg border px-3 py-2 text-sm transition-colors",
                duration === d.value
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border hover:border-primary/50"
              )}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Voice */}
      <div>
        <label className="mb-2 block text-sm font-medium">
          Narration Voice
        </label>
        <div className="flex gap-3">
          {VOICES.map((v) => (
            <button
              key={v.value}
              type="button"
              onClick={() => {
                setVoice(v.value);
                setSaved(false);
              }}
              className={cn(
                "rounded-lg border px-4 py-3 text-left transition-colors",
                voice === v.value
                  ? "border-primary bg-primary/10"
                  : "border-border hover:border-primary/50"
              )}
            >
              <div className="text-sm font-medium">{v.label}</div>
              <div className="text-xs text-muted-foreground">
                {v.description}
              </div>
            </button>
          ))}
        </div>
      </div>

      <Button onClick={handleSave} disabled={isSaving}>
        {isSaving ? "Saving..." : saved ? "Saved!" : "Save Preferences"}
      </Button>
    </div>
  );
}
