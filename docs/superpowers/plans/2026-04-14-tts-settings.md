# TTS / Voice Settings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an in-player settings panel that lets users adjust rate, pitch, volume, voice, language, and preferred engine for meditation playback, with `localStorage` persistence.

**Architecture:** One hook (`useVoiceSettings`) owns read/write of a single `localStorage` key. A presentational `VoiceSettingsPanel` component renders the controls. `MeditationPlayer` owns the hook, passes settings down, applies them live to the `<audio>` element and `SpeechSynthesisUtterance`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS v4, `@base-ui/react` (already installed), lucide-react icons.

**Note on testing:** This repo has no React test infrastructure (no Jest/Vitest/RTL). Per the spec, verification is manual. Steps use TypeScript compile + lint + manual browser checks as the verification gate. Do NOT add a test framework as part of this plan — it's out of scope.

**File structure:**

- `src/lib/voice-settings.ts` — new. Type, defaults, storage key, React hook.
- `src/components/voice-settings-panel.tsx` — new. Pure presentational panel.
- `src/components/meditation-player.tsx` — modified. Integrate hook, gear button, apply settings to audio + TTS.

---

### Task 1: Create voice-settings module with type and defaults

**Files:**
- Create: `src/lib/voice-settings.ts`

- [ ] **Step 1: Write the module skeleton**

Create `src/lib/voice-settings.ts` with:

```ts
"use client";

import { useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "mindful:voice-settings";

export type VoiceSettings = {
  rate: number;
  pitch: number;
  volume: number;
  voiceURI: string | null;
  lang: string;
  preferredEngine: "audio" | "tts";
};

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  rate: 0.9,
  pitch: 0.95,
  volume: 1,
  voiceURI: null,
  lang: "en-US",
  preferredEngine: "audio",
};

function readStorage(): VoiceSettings {
  if (typeof window === "undefined") return DEFAULT_VOICE_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_VOICE_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<VoiceSettings>;
    return { ...DEFAULT_VOICE_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_VOICE_SETTINGS;
  }
}

function writeStorage(settings: VoiceSettings) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // localStorage unavailable (private mode, quota): ignore
  }
}

export function useVoiceSettings(): [
  VoiceSettings,
  (patch: Partial<VoiceSettings>) => void,
  () => void,
] {
  const [settings, setSettings] = useState<VoiceSettings>(DEFAULT_VOICE_SETTINGS);

  // Hydrate from localStorage after mount (SSR-safe)
  useEffect(() => {
    setSettings(readStorage());
  }, []);

  const update = useCallback((patch: Partial<VoiceSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      writeStorage(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setSettings(DEFAULT_VOICE_SETTINGS);
    writeStorage(DEFAULT_VOICE_SETTINGS);
  }, []);

  return [settings, update, reset];
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors in `src/lib/voice-settings.ts`.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no errors in `src/lib/voice-settings.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/lib/voice-settings.ts
git commit -m "feat: add voice-settings hook with localStorage persistence"
```

---

### Task 2: Create the VoiceSettingsPanel component

**Files:**
- Create: `src/components/voice-settings-panel.tsx`

This component is purely presentational. It receives `settings`, `onChange`, `onReset`, and `currentMode` as props. It uses native range inputs and selects (no new primitive dependencies). The panel body is rendered inline by the parent — the parent decides whether to show it.

- [ ] **Step 1: Create the component file**

Create `src/components/voice-settings-panel.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VoiceSettings } from "@/lib/voice-settings";

interface VoiceSettingsPanelProps {
  settings: VoiceSettings;
  onChange: (patch: Partial<VoiceSettings>) => void;
  onReset: () => void;
  currentMode: "audio" | "tts";
}

const LANGUAGES = [
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "en-AU", label: "English (AU)" },
];

export function VoiceSettingsPanel({
  settings,
  onChange,
  onReset,
  currentMode,
}: VoiceSettingsPanelProps) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Load browser TTS voices (Chrome populates asynchronously)
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    function loadVoices() {
      setVoices(window.speechSynthesis.getVoices());
    }

    loadVoices();
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
    };
  }, []);

  const ttsDisabled = currentMode === "audio";
  const filteredVoices = voices.filter((v) => v.lang.startsWith(settings.lang.split("-")[0]));

  return (
    <div className="space-y-5 rounded-xl bg-card p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Voice settings</h3>
        <Button variant="ghost" size="sm" onClick={onReset}>
          <RotateCcw className="mr-1 h-3.5 w-3.5" />
          Reset
        </Button>
      </div>

      {/* Rate */}
      <Field label={`Speed: ${settings.rate.toFixed(2)}×`}>
        <input
          type="range"
          min={0.5}
          max={1.5}
          step={0.05}
          value={settings.rate}
          onChange={(e) => onChange({ rate: Number(e.target.value) })}
          className="w-full"
        />
      </Field>

      {/* Volume */}
      <Field label={`Volume: ${Math.round(settings.volume * 100)}%`}>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={settings.volume}
          onChange={(e) => onChange({ volume: Number(e.target.value) })}
          className="w-full"
        />
      </Field>

      {/* Pitch — TTS only */}
      <Field
        label={`Pitch: ${settings.pitch.toFixed(2)}`}
        disabled={ttsDisabled}
        tooltip="Pitch can't be changed for pre-recorded audio"
      >
        <input
          type="range"
          min={0.5}
          max={1.5}
          step={0.05}
          value={settings.pitch}
          onChange={(e) => onChange({ pitch: Number(e.target.value) })}
          disabled={ttsDisabled}
          className="w-full"
        />
      </Field>

      {/* Language — TTS only */}
      <Field
        label="Language"
        disabled={ttsDisabled}
        tooltip="Language can't be changed for pre-recorded audio"
      >
        <select
          value={settings.lang}
          onChange={(e) => onChange({ lang: e.target.value, voiceURI: null })}
          disabled={ttsDisabled}
          className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm disabled:opacity-50"
        >
          {LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
      </Field>

      {/* Voice — TTS only. Fall back to "" (Auto) if stored voiceURI no longer exists. */}
      {(() => {
        const storedExists =
          settings.voiceURI !== null &&
          filteredVoices.some((v) => v.voiceURI === settings.voiceURI);
        const effectiveValue = storedExists ? (settings.voiceURI as string) : "";
        return (
          <Field
            label="Voice"
            disabled={ttsDisabled}
            tooltip="Voice can't be changed for pre-recorded audio"
          >
            <select
              value={effectiveValue}
              onChange={(e) => onChange({ voiceURI: e.target.value || null })}
              disabled={ttsDisabled}
              className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm disabled:opacity-50"
            >
              <option value="">Auto</option>
              {filteredVoices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name}
                </option>
              ))}
            </select>
          </Field>
        );
      })()}

      {/* Preferred engine — always enabled */}
      <Field label="Prefer">
        <div className="flex flex-col gap-2 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="preferredEngine"
              checked={settings.preferredEngine === "audio"}
              onChange={() => onChange({ preferredEngine: "audio" })}
            />
            Pre-recorded audio when available
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="preferredEngine"
              checked={settings.preferredEngine === "tts"}
              onChange={() => onChange({ preferredEngine: "tts" })}
            />
            Always use browser voice
          </label>
        </div>
      </Field>
    </div>
  );
}

function Field({
  label,
  disabled,
  tooltip,
  children,
}: {
  label: string;
  disabled?: boolean;
  tooltip?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={disabled ? "opacity-50" : ""} title={disabled ? tooltip : undefined}>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors in `src/components/voice-settings-panel.tsx`.

- [ ] **Step 3: Lint**

Run: `npm run lint`
Expected: no errors in `src/components/voice-settings-panel.tsx`.

- [ ] **Step 4: Commit**

```bash
git add src/components/voice-settings-panel.tsx
git commit -m "feat: add VoiceSettingsPanel component"
```

---

### Task 3: Integrate settings into MeditationPlayer

**Files:**
- Modify: `src/components/meditation-player.tsx`

This is the integration task. Changes:

1. Import the hook, the panel, and the `Settings` icon.
2. Call `useVoiceSettings()`.
3. Change initial mode selection to respect `preferredEngine`.
4. Apply `rate`/`volume` to `<audio>` via an effect.
5. Apply all settings to `SpeechSynthesisUtterance` in `startTTS()`.
6. Add a gear button that toggles the panel (same pattern as the existing `showScript` toggle).
7. Render the panel inline below the controls when open.

- [ ] **Step 1: Update imports**

Replace the import block at the top of `src/components/meditation-player.tsx`:

```tsx
"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Play, Pause, RotateCcw, Volume2, FileText, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useVoiceSettings } from "@/lib/voice-settings";
import { VoiceSettingsPanel } from "@/components/voice-settings-panel";
```

- [ ] **Step 2: Use the hook and update mode init**

Inside the `MeditationPlayer` function, below the existing refs, add:

```tsx
const [settings, updateSettings, resetSettings] = useVoiceSettings();
const [showSettings, setShowSettings] = useState(false);
```

Change the existing `mode` state initializer from:

```tsx
const [mode, setMode] = useState<"audio" | "tts" | "text">(
  audioUrl ? "audio" : "tts"
);
```

to:

```tsx
const [mode, setMode] = useState<"audio" | "tts" | "text">(
  audioUrl && settings.preferredEngine === "audio" ? "audio" : "tts"
);
```

Then, immediately below that `useState`, add an effect that syncs mode to `preferredEngine` if the user toggles it mid-session:

```tsx
useEffect(() => {
  if (mode === "text") return;
  const next = audioUrl && settings.preferredEngine === "audio" ? "audio" : "tts";
  if (next !== mode) {
    window.speechSynthesis?.cancel();
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsPlaying(false);
    setCurrentTime(0);
    setMode(next);
  }
}, [settings.preferredEngine, audioUrl, mode]);
```

- [ ] **Step 3: Apply rate/volume live to the `<audio>` element**

Add this effect immediately after the existing audio-element event listeners `useEffect`:

```tsx
useEffect(() => {
  if (mode !== "audio" || !audioRef.current) return;
  audioRef.current.playbackRate = settings.rate;
  audioRef.current.volume = settings.volume;
}, [mode, settings.rate, settings.volume]);
```

- [ ] **Step 4: Apply settings in `startTTS()`**

Replace the existing `startTTS` function body with:

```tsx
function startTTS() {
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(script);
  utterance.rate = settings.rate;
  utterance.pitch = settings.pitch;
  utterance.volume = settings.volume;
  utterance.lang = settings.lang;

  // Pick voice: stored voiceURI first, then heuristic fallback
  const voices = window.speechSynthesis.getVoices();
  let chosen: SpeechSynthesisVoice | undefined;
  if (settings.voiceURI) {
    chosen = voices.find((v) => v.voiceURI === settings.voiceURI);
  }
  if (!chosen) {
    chosen = voices.find(
      (v) =>
        v.name.includes("Samantha") ||
        v.name.includes("Karen") ||
        v.name.includes("Google UK English Female") ||
        (v.lang.startsWith("en") && v.name.toLowerCase().includes("female"))
    );
  }
  if (chosen) utterance.voice = chosen;

  utterance.onend = () => {
    setIsPlaying(false);
    onComplete();
  };

  utteranceRef.current = utterance;
  startTimeRef.current = Date.now();
  window.speechSynthesis.speak(utterance);
  setIsPlaying(true);
}
```

- [ ] **Step 5: Add gear button and panel render**

Replace the existing "Controls" block:

```tsx
{/* Controls */}
<div className="flex justify-center gap-4">
  <Button variant="outline" size="sm" onClick={restart}>
    <RotateCcw className="mr-1 h-4 w-4" />
    Restart
  </Button>
  <Button
    variant="outline"
    size="sm"
    onClick={() => setShowScript(!showScript)}
  >
    <FileText className="mr-1 h-4 w-4" />
    {showScript ? "Hide Text" : "Show Text"}
  </Button>
</div>
```

with:

```tsx
{/* Controls */}
<div className="flex justify-center gap-4">
  <Button variant="outline" size="sm" onClick={restart}>
    <RotateCcw className="mr-1 h-4 w-4" />
    Restart
  </Button>
  <Button
    variant="outline"
    size="sm"
    onClick={() => setShowScript(!showScript)}
  >
    <FileText className="mr-1 h-4 w-4" />
    {showScript ? "Hide Text" : "Show Text"}
  </Button>
  <Button
    variant="outline"
    size="sm"
    onClick={() => setShowSettings(!showSettings)}
  >
    <Settings className="mr-1 h-4 w-4" />
    Voice
  </Button>
</div>

{showSettings && (
  <VoiceSettingsPanel
    settings={settings}
    onChange={updateSettings}
    onReset={resetSettings}
    currentMode={mode === "text" ? "tts" : mode}
  />
)}
```

- [ ] **Step 6: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 7: Lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/components/meditation-player.tsx
git commit -m "feat: wire voice settings into meditation player"
```

---

### Task 4: Manual verification in the browser

**Files:** none (verification only)

- [ ] **Step 1: Start the dev server**

Run: `npm run dev`
Expected: server starts on port 3333 (it may already be running via launchd — verify with `curl -s -o /dev/null -w "%{http_code}" http://localhost:3333` which should return `200` or `307`).

- [ ] **Step 2: Open a meditation with pre-rendered audio**

Navigate to `http://localhost:3333` in the browser, sign in, and open a meditation that has `audioUrl` set. Click the new **Voice** button.

Expected: the settings panel appears below the controls. Rate, volume, and preferred engine are enabled. Pitch, language, and voice are visibly disabled (opacity reduced) with a tooltip on hover.

- [ ] **Step 3: Change rate mid-playback**

Start playback, drag the Speed slider to 1.25×.

Expected: audio immediately speeds up. The slider label updates to `Speed: 1.25×`.

- [ ] **Step 4: Change volume mid-playback**

Drag the Volume slider to 50%.

Expected: audio becomes quieter immediately.

- [ ] **Step 5: Toggle to "Always use browser voice"**

In the Prefer section, select "Always use browser voice".

Expected: the player stops audio playback, switches to TTS mode, the "Using device voice" indicator appears, and the pitch/language/voice controls become enabled.

- [ ] **Step 6: Change voice and language**

Select a different language from the dropdown, then pick a specific voice from the now-populated Voice dropdown. Click Play.

Expected: TTS plays with the selected voice.

- [ ] **Step 7: Reload and verify persistence**

Reload the page (`Cmd+R`).

Expected: the Voice button opens the panel with all previously set values retained (rate, volume, pitch, voice, language, preferred engine).

- [ ] **Step 8: Reset to defaults**

Click **Reset** in the panel.

Expected: all fields return to defaults (Speed 0.90×, Volume 100%, Pitch 0.95, Language English (US), Voice Auto, Prefer "Pre-recorded audio when available"). Reload and confirm persistence.

- [ ] **Step 9: Corrupt localStorage fallback check**

In devtools console: `localStorage.setItem("mindful:voice-settings", "not-json{")`. Reload.

Expected: the player loads without errors and the panel shows default values.

- [ ] **Step 10: No stray issues**

Open the browser console.

Expected: no errors or warnings originating from the meditation player or the new files.

- [ ] **Step 11: Final commit if any fixes were needed**

If any of the above required code changes, commit them with a descriptive message. If everything worked on the first try, skip.

---

## Done

All three files implemented, settings persist, all knobs work in the modes where they apply. No automated tests were added — that's intentional per the scope note at the top of this plan.
