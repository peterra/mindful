"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { saveOnboarding } from "./actions";

const EXPERIENCE_LEVELS = [
  {
    value: "beginner",
    label: "I've never meditated",
    description: "Complete beginner — let's start from scratch",
  },
  {
    value: "some_experience",
    label: "I've tried it a few times",
    description: "Some experience but not a regular practice",
  },
  {
    value: "regular",
    label: "I meditate regularly",
    description: "Looking to deepen my existing practice",
  },
] as const;

const FOCUS_AREAS = [
  { value: "stress", label: "Stress Relief", emoji: "🧘" },
  { value: "focus", label: "Focus & Clarity", emoji: "🎯" },
  { value: "sleep", label: "Better Sleep", emoji: "🌙" },
  { value: "emotional", label: "Emotional Balance", emoji: "💚" },
  { value: "general", label: "General Wellness", emoji: "✨" },
] as const;

const DURATIONS = [
  { value: 3, label: "3 min", description: "Quick reset" },
  { value: 5, label: "5 min", description: "Daily minimum" },
  { value: 10, label: "10 min", description: "Sweet spot" },
  { value: 15, label: "15 min", description: "Deeper practice" },
  { value: 20, label: "20 min", description: "Full session" },
] as const;

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [experienceLevel, setExperienceLevel] = useState("");
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [preferredDuration, setPreferredDuration] = useState(5);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function toggleFocusArea(value: string) {
    setFocusAreas((prev) =>
      prev.includes(value)
        ? prev.filter((v) => v !== value)
        : [...prev, value]
    );
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    const formData = new FormData();
    formData.set("experienceLevel", experienceLevel);
    for (const area of focusAreas) {
      formData.append("focusAreas", area);
    }
    formData.set("preferredDuration", String(preferredDuration));
    await saveOnboarding(formData);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="mb-8 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <span className="text-lg font-semibold">Mindful</span>
      </div>

      <Card className="w-full max-w-lg">
        <CardHeader>
          <div className="mb-2 flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-colors",
                  i <= step ? "bg-primary" : "bg-muted"
                )}
              />
            ))}
          </div>
          <CardTitle>
            {step === 0 && "What's your meditation experience?"}
            {step === 1 && "What would you like to focus on?"}
            {step === 2 && "How long do you want to meditate?"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {step === 0 && (
            <div className="space-y-3">
              {EXPERIENCE_LEVELS.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => setExperienceLevel(level.value)}
                  className={cn(
                    "w-full rounded-lg border p-4 text-left transition-colors",
                    experienceLevel === level.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <div className="font-medium">{level.label}</div>
                  <div className="text-sm text-muted-foreground">
                    {level.description}
                  </div>
                </button>
              ))}
              <Button
                className="mt-4 w-full"
                disabled={!experienceLevel}
                onClick={() => setStep(1)}
              >
                Continue
              </Button>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Select all that apply
              </p>
              {FOCUS_AREAS.map((area) => (
                <button
                  key={area.value}
                  type="button"
                  onClick={() => toggleFocusArea(area.value)}
                  className={cn(
                    "w-full rounded-lg border p-4 text-left transition-colors",
                    focusAreas.includes(area.value)
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  )}
                >
                  <span className="mr-2">{area.emoji}</span>
                  <span className="font-medium">{area.label}</span>
                </button>
              ))}
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep(0)}
                >
                  Back
                </Button>
                <Button
                  className="flex-1"
                  disabled={focusAreas.length === 0}
                  onClick={() => setStep(2)}
                >
                  Continue
                </Button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <div className="grid grid-cols-5 gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => setPreferredDuration(d.value)}
                    className={cn(
                      "flex flex-col items-center rounded-lg border p-3 transition-colors",
                      preferredDuration === d.value
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <span className="text-lg font-semibold">{d.label}</span>
                    <span className="text-xs text-muted-foreground">
                      {d.description}
                    </span>
                  </button>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
                <Button
                  className="flex-1"
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                >
                  {isSubmitting ? "Setting up..." : "Start meditating"}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
