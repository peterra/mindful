"use client";

import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "mindful:voice-settings";

export type VoiceSettings = {
  rate: number;
  pitch: number;
  volume: number;
  voiceURI: string | null;
  lang: string;
  preferredEngine: "audio" | "tts";
};

export const DEFAULT_VOICE_SETTINGS: Readonly<VoiceSettings> = Object.freeze({
  rate: 0.9,
  pitch: 0.95,
  volume: 1,
  voiceURI: null,
  lang: "en-US",
  preferredEngine: "audio",
});

function readStorage(): VoiceSettings {
  if (typeof window === "undefined") return DEFAULT_VOICE_SETTINGS;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_VOICE_SETTINGS;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const preferredEngine =
      parsed.preferredEngine === "audio" || parsed.preferredEngine === "tts"
        ? parsed.preferredEngine
        : DEFAULT_VOICE_SETTINGS.preferredEngine;
    return { ...DEFAULT_VOICE_SETTINGS, ...parsed, preferredEngine };
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

  // Hydrate from localStorage after mount. This must be done in an effect
  // (not a lazy initializer) so the server render and the client's first
  // render both use defaults, avoiding a hydration mismatch. The stored
  // values are applied after hydration.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
