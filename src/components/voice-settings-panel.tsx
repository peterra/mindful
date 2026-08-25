"use client";

import { useEffect, useId, useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VoiceSettings } from "@/lib/voice-settings";
import {
  MIN_PRESET_SPEED,
  MAX_PRESET_SPEED,
  type VisualizationPresetSummary,
} from "@/lib/visualization-presets";
import {
  listVisualizationPresets,
  saveVisualizationPreset,
  deleteVisualizationPreset,
} from "@/app/(app)/meditate/visualization-actions";

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
  const [presets, setPresets] = useState<VisualizationPresetSummary[]>([]);
  const [newPresetName, setNewPresetName] = useState("");
  const [presetError, setPresetError] = useState<string | null>(null);
  const pitchDescId = useId();
  const langDescId = useId();
  const voiceDescId = useId();

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

  // Load saved visualization presets once on mount.
  useEffect(() => {
    listVisualizationPresets()
      .then(setPresets)
      .catch(() => setPresetError("Couldn't load saved visualizations"));
  }, []);

  const ttsDisabled = currentMode === "audio";
  // Exact BCP-47 match — some platforms use underscores (en_GB) so normalize first.
  const filteredVoices = voices.filter(
    (v) => v.lang.replace("_", "-") === settings.lang
  );

  // If the stored voiceURI is not present in the current filtered list,
  // show "Auto" as the effective selection so the <select> isn't in a blank state.
  const storedExists =
    settings.voiceURI !== null &&
    filteredVoices.some((v) => v.voiceURI === settings.voiceURI);
  const effectiveVoiceURI = storedExists ? (settings.voiceURI as string) : "";

  async function handleSavePreset() {
    const trimmed = newPresetName.trim();
    if (!trimmed) return;
    setPresetError(null);
    try {
      const created = await saveVisualizationPreset(
        trimmed,
        settings.visualStyle,
        settings.visualSpeed
      );
      setPresets((prev) => [created, ...prev]);
      setNewPresetName("");
    } catch {
      setPresetError("Couldn't save that visualization");
    }
  }

  async function handleDeletePreset(id: string) {
    setPresetError(null);
    try {
      await deleteVisualizationPreset(id);
      setPresets((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setPresetError("Couldn't delete that visualization");
    }
  }

  function handleUsePreset(preset: VisualizationPresetSummary) {
    onChange({ visualStyle: preset.style, visualSpeed: preset.speed });
  }

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
      >
        <span id={pitchDescId} className="sr-only">
          Pitch can&apos;t be changed for pre-recorded audio
        </span>
        <input
          type="range"
          min={0.5}
          max={1.5}
          step={0.05}
          value={settings.pitch}
          onChange={(e) => onChange({ pitch: Number(e.target.value) })}
          disabled={ttsDisabled}
          aria-describedby={ttsDisabled ? pitchDescId : undefined}
          className="w-full"
        />
      </Field>

      {/* Language — TTS only */}
      <Field
        label="Language"
        disabled={ttsDisabled}
      >
        <span id={langDescId} className="sr-only">
          Language can&apos;t be changed for pre-recorded audio
        </span>
        <select
          value={settings.lang}
          onChange={(e) => onChange({ lang: e.target.value, voiceURI: null })}
          disabled={ttsDisabled}
          aria-describedby={ttsDisabled ? langDescId : undefined}
          className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm disabled:opacity-50"
        >
          {LANGUAGES.map((l) => (
            <option key={l.value} value={l.value}>
              {l.label}
            </option>
          ))}
        </select>
      </Field>

      {/* Voice — TTS only */}
      <Field
        label="Voice"
        disabled={ttsDisabled}
      >
        <span id={voiceDescId} className="sr-only">
          Voice can&apos;t be changed for pre-recorded audio
        </span>
        <select
          value={effectiveVoiceURI}
          onChange={(e) => onChange({ voiceURI: e.target.value || null })}
          disabled={ttsDisabled}
          aria-describedby={ttsDisabled ? voiceDescId : undefined}
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

      {/* Visual speed — always enabled */}
      <Field label={`Visual speed: ${settings.visualSpeed.toFixed(2)}×`}>
        <input
          type="range"
          min={MIN_PRESET_SPEED}
          max={MAX_PRESET_SPEED}
          step={0.01}
          value={settings.visualSpeed}
          onChange={(e) => onChange({ visualSpeed: Number(e.target.value) })}
          className="w-full"
        />
      </Field>

      {/* Visual style — always enabled */}
      <Field label="Visual style">
        <div className="flex flex-col gap-2 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="visualStyle"
              checked={settings.visualStyle === "bloom"}
              onChange={() => onChange({ visualStyle: "bloom" })}
            />
            Soft Bloom
          </label>
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name="visualStyle"
              checked={settings.visualStyle === "sine"}
              onChange={() => onChange({ visualStyle: "sine" })}
            />
            Sine Wave
          </label>
        </div>
      </Field>

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

      {/* Saved visualizations */}
      <div className="space-y-3 border-t border-border pt-5">
        <h4 className="text-sm font-medium">Saved visualizations</h4>

        {presetError && (
          <p className="text-xs text-destructive">{presetError}</p>
        )}

        {presets.length > 0 && (
          <ul className="space-y-2">
            {presets.map((preset) => (
              <li
                key={preset.id}
                className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{preset.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {preset.style === "bloom" ? "Soft Bloom" : "Sine Wave"} ·{" "}
                    {preset.speed.toFixed(2)}×
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUsePreset(preset)}
                  >
                    Use
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Delete ${preset.name}`}
                    onClick={() => handleDeletePreset(preset.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            value={newPresetName}
            onChange={(e) => setNewPresetName(e.target.value)}
            placeholder="Name this visualization"
            className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          />
          <Button
            variant="outline"
            size="sm"
            disabled={!newPresetName.trim()}
            onClick={handleSavePreset}
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  disabled,
  children,
}: {
  label: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={disabled ? "opacity-50" : ""}>
      <label className="mb-1.5 block text-xs font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
