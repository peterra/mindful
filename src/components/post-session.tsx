"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface PostSessionProps {
  onSubmit: (data: {
    moodBefore: number;
    moodAfter: number;
    journalNote: string;
  }) => Promise<void>;
}

const MOOD_EMOJIS = ["😔", "😕", "😐", "🙂", "😊"];

export function PostSession({ onSubmit }: PostSessionProps) {
  const [moodBefore, setMoodBefore] = useState(3);
  const [moodAfter, setMoodAfter] = useState(3);
  const [journalNote, setJournalNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<"before" | "after" | "journal">("before");

  async function handleSubmit() {
    setIsSubmitting(true);
    await onSubmit({ moodBefore, moodAfter, journalNote });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">
          {step === "before" && "How were you feeling before?"}
          {step === "after" && "How are you feeling now?"}
          {step === "journal" && "Any reflections?"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {(step === "before" || step === "after") && (
          <div className="space-y-4">
            <div className="flex justify-center gap-4">
              {MOOD_EMOJIS.map((emoji, i) => {
                const value = i + 1;
                const selected =
                  step === "before" ? moodBefore === value : moodAfter === value;
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() =>
                      step === "before"
                        ? setMoodBefore(value)
                        : setMoodAfter(value)
                    }
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-full text-2xl transition-all",
                      selected
                        ? "scale-125 bg-primary/10 ring-2 ring-primary"
                        : "hover:bg-muted"
                    )}
                  >
                    {emoji}
                  </button>
                );
              })}
            </div>
            <Button
              className="w-full"
              onClick={() => setStep(step === "before" ? "after" : "journal")}
            >
              Continue
            </Button>
          </div>
        )}

        {step === "journal" && (
          <div className="space-y-4">
            <textarea
              value={journalNote}
              onChange={(e) => setJournalNote(e.target.value)}
              placeholder="How was your practice? Any thoughts or feelings to note... (optional)"
              className="min-h-24 w-full resize-none rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                disabled={isSubmitting}
                onClick={handleSubmit}
              >
                Skip
              </Button>
              <Button
                className="flex-1"
                disabled={isSubmitting}
                onClick={handleSubmit}
              >
                {isSubmitting ? "Saving..." : "Save & Finish"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
