# TTS / Voice Settings

Lets users adjust text-to-speech playback settings from a panel inside the meditation player. Settings persist to `localStorage` and apply to both pre-rendered Google Cloud audio and browser `SpeechSynthesis`.

## Context

The meditation player (`src/components/meditation-player.tsx`) plays audio in three modes:

1. **audio** — HTML `<audio>` element playing a pre-rendered Google Cloud TTS mp3 (blob URL on `meditation.audioUrl`)
2. **tts** — `window.speechSynthesis` reading the script directly in the browser
3. **text** — static script display, fallback when browser TTS is unavailable

All knobs are currently hardcoded: server generation uses `speakingRate: 0.9, pitch: -1.0` (`src/lib/tts.ts`), browser TTS uses `rate: 0.85, pitch: 0.95` and a heuristic voice picker (`meditation-player.tsx:92-119`). There is no way for a user to change any of this.

## Constraint: pre-rendered audio is frozen

Pre-rendered Google audio has pitch, voice, language, and base speaking rate baked in at generation time. At playback, `HTMLAudioElement` supports only `playbackRate` and `volume` — there is no independent pitch or voice swap. This means in **audio mode**, rate and volume are live but pitch, voice, and language are effectively read-only. In **tts mode**, all knobs apply fully.

## Scope

**In scope**

- In-player slide-over/popover settings panel triggered by a gear icon
- Per-device persistence via `localStorage`
- Knobs: rate, pitch, volume, voice, language, preferred engine
- Live application of settings to the currently playing session
- Disabled (not hidden) controls with tooltip explanation when they don't apply to the current mode

**Out of scope**

- Admin/global server TTS defaults UI (`src/lib/tts.ts` hardcoded rate/pitch/voice stay as-is)
- Regenerating pre-rendered audio when user settings change
- Cross-device sync (localStorage only)
- Dedicated `/settings` page (player-only UI)
- Server-side user preferences (no DB schema change, no Clerk metadata)

## Architecture

Three new or modified files:

### `src/lib/voice-settings.ts` (new)

Owns the type, defaults, storage key, and a React hook.

```ts
const STORAGE_KEY = "mindful:voice-settings";

export type VoiceSettings = {
  rate: number;           // 0.5–1.5, default 0.9
  pitch: number;          // 0.5–1.5, default 0.95 (tts mode only)
  volume: number;         // 0–1, default 1
  voiceURI: string | null;// browser TTS voice identifier, null = auto-pick
  lang: string;           // BCP-47, default "en-US"
  preferredEngine: "audio" | "tts"; // which to pick when audioUrl is present
};

export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  rate: 0.9,
  pitch: 0.95,
  volume: 1,
  voiceURI: null,
  lang: "en-US",
  preferredEngine: "audio",
};

export function useVoiceSettings(): [VoiceSettings, (patch: Partial<VoiceSettings>) => void];
```

The hook is SSR-safe: it initializes to `DEFAULT_VOICE_SETTINGS` on the server, then hydrates from `localStorage` in a `useEffect` after mount. Writes immediately persist to `localStorage` and update state. Patch-style updater merges into the current value.

### `src/components/voice-settings-panel.tsx` (new)

Pure presentational component. Receives `settings`, `onChange`, and `currentMode` ("audio" | "tts") as props. Renders a Base UI Dialog or Popover with:

- Rate slider (0.5–1.5, step 0.05)
- Pitch slider (0.5–1.5, step 0.05) — disabled in audio mode with tooltip "Pitch can't be changed for pre-recorded audio"
- Volume slider (0–1, step 0.05)
- Voice `<select>` populated from `window.speechSynthesis.getVoices()` filtered by language — disabled in audio mode
- Language `<select>` with a small curated list (en-US, en-GB, en-AU) — disabled in audio mode
- Preferred-engine radio ("Pre-recorded audio when available" / "Always use browser voice") — always enabled
- "Reset to defaults" button

The component subscribes to `window.speechSynthesis`'s `voiceschanged` event for the voice list (Chrome populates asynchronously).

### `src/components/meditation-player.tsx` (modified)

- Calls `useVoiceSettings()` at top of component
- Mode selection becomes: `audioUrl && settings.preferredEngine === "audio" ? "audio" : "tts"` (text fallback unchanged)
- Adds a gear `Button` next to the Restart / Show Text buttons that opens the panel
- Audio element `useEffect` sets `audio.playbackRate = settings.rate` and `audio.volume = settings.volume` whenever those change (and when the audio element mounts)
- `startTTS()` reads current settings for `rate`, `pitch`, `volume`, `lang`, and looks up the voice by `voiceURI` (falling back to the current heuristic picker if `voiceURI` is null or the voice is no longer present)

## Data flow

```
localStorage  <──>  useVoiceSettings()  ──>  MeditationPlayer
                                                  │
                                                  ├──>  <audio> (playbackRate, volume)
                                                  ├──>  SpeechSynthesisUtterance (rate, pitch, volume, voice, lang)
                                                  └──>  <VoiceSettingsPanel settings onChange currentMode>
```

One source of truth (`localStorage`), one hook, one owner component (`MeditationPlayer`). The panel is fully controlled.

## Mode-to-control matrix

| Control | Audio mode | TTS mode |
|---|---|---|
| Rate | `audio.playbackRate` | `utterance.rate` |
| Volume | `audio.volume` | `utterance.volume` |
| Pitch | disabled | `utterance.pitch` |
| Voice | disabled | `utterance.voice` |
| Language | disabled | `utterance.lang` |
| Preferred engine | affects initial mode | affects initial mode |

Disabled controls still display the stored value so the user sees what would apply if they switched engines.

## Error handling and edge cases

- **localStorage unavailable or corrupt JSON**: catch the parse/access error in `useVoiceSettings`, fall back to `DEFAULT_VOICE_SETTINGS`, and do not throw
- **Stored `voiceURI` no longer exists** (user moved devices or voice was uninstalled): `startTTS()` falls back to the existing heuristic voice picker, the panel's voice `<select>` shows "Auto" as the effective selection
- **`window.speechSynthesis` unavailable**: mode drops to `"text"` as it already does; the gear button is hidden in text mode (no settings apply)
- **Rate change mid-playback in TTS mode**: `SpeechSynthesisUtterance` properties are read when `speak()` is called and cannot be changed on an in-flight utterance. The player re-starts the utterance from the current word boundary — but since boundary tracking isn't implemented today, the simpler behavior is: changes to rate/pitch/voice/volume in TTS mode take effect on the next play or restart, and the panel shows a subtle "Applies on next play" hint when a TTS-only control changes during playback
- **Rate change mid-playback in audio mode**: applies live — the `useEffect` assigns to `audio.playbackRate` immediately

## Testing

No automated test infrastructure for React components exists in the repo today. Verification is manual:

1. Open a meditation with pre-rendered audio. Confirm mode is "audio". Open panel, change rate — audio plays back faster/slower live. Change volume — live. Confirm pitch, voice, language sliders/selects are disabled with tooltip.
2. Switch preferred engine to "Always use browser voice", reload page, confirm mode is now "tts". Change pitch, voice, language — confirm new utterance uses them on next play.
3. Reload the page after changing settings — settings persist.
4. Clear `localStorage.mindful:voice-settings` in devtools, reload — defaults restore.
5. Open the player on a meditation without `audioUrl` — confirm mode is "tts" regardless of `preferredEngine`.
6. In an incognito window with `localStorage` disabled, confirm the player still loads and uses defaults.

## Files touched

- `src/lib/voice-settings.ts` (new)
- `src/components/voice-settings-panel.tsx` (new)
- `src/components/meditation-player.tsx` (modified)
