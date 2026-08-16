"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { EMOTION_WORD_BANK } from "@/lib/emotion-words";
import { cn } from "@/lib/utils";

interface NameItNamingStepProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isSaving: boolean;
}

export function NameItNamingStep({
  value,
  onChange,
  onSubmit,
  isSaving,
}: NameItNamingStepProps) {
  const [showWordBank, setShowWordBank] = useState(false);

  function addWord(word: string) {
    onChange(value.trim() ? `${value.trim()}, ${word}` : word);
  }

  return (
    <div className="space-y-4">
      <p className="text-center text-sm text-muted-foreground">
        What would you name this feeling?
      </p>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type a word or a few..."
        maxLength={200}
        className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
      />
      <div className="text-center">
        <button
          type="button"
          className="text-xs text-muted-foreground underline underline-offset-2"
          onClick={() => setShowWordBank((s) => !s)}
        >
          {showWordBank ? "Hide suggestions" : "Need help naming it?"}
        </button>
      </div>
      {showWordBank && (
        <div className="space-y-3">
          {EMOTION_WORD_BANK.map((group) => (
            <div key={group.category}>
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                {group.category}
              </p>
              <div className="flex flex-wrap gap-2">
                {group.words.map((word) => (
                  <button
                    key={word}
                    type="button"
                    onClick={() => addWord(word)}
                    className={cn(
                      "rounded-full bg-muted px-3 py-1 text-xs hover:bg-accent"
                    )}
                  >
                    {word}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="flex justify-center">
        <Button disabled={!value.trim() || isSaving} onClick={onSubmit}>
          {isSaving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
