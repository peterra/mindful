# Visualization Styles, Mouse-Driven Sine Wave, and Saved Presets

Adds a second full-screen meditation visual (a mouse-reactive scrolling sine wave) alongside the existing breathing dot, plus the ability to save and recall named visualization presets (style + speed) tied to the user's account.

## Context

`src/components/breathing-dot-overlay.tsx` currently renders one visual: a soft, dual-layer crossfading circle ("Soft Bloom") that grows from a point and fades before restarting. Its speed is a single `visualSpeed` field in `src/lib/voice-settings.ts`, a `localStorage`-backed settings object also used for TTS voice controls, exposed via `VoiceSettingsPanel` inside `MeditationPlayer`.

This adds:

1. A second style, a horizontal traveling sine wave, whose speed responds live to mouse X position.
2. A way to save the current style+speed combination as a named preset, list saved presets, apply one, and delete one — persisted per-account in Postgres (via Drizzle), not `localStorage`, so presets follow the user across devices.

## Scope

**In scope**

- `style` field (`"bloom" | "sine"`) added to the existing `VoiceSettings` type/localStorage object
- New Canvas-based sine wave visual with mouse-X-driven speed (falls back to the existing speed slider as a baseline/resting value)
- New DB table + server actions for preset CRUD (save, list, delete — no rename)
- Settings panel UI: style picker, saved-visualizations list with Use/Delete, "save current as" form

**Out of scope**

- Renaming saved presets
- A third built-in style (Linear Pulse / Breathing Pulse from the earlier throwaway preview are not being added)
- Any change to audio/TTS behavior
- Sharing presets between users, or admin-curated presets
- Preset count limits (unlimited for now — no signal this needs bounding)

## Data model

```ts
// src/db/schema.ts — new table, same shape/conventions as feelingEntries etc.
export const visualizationPresets = pgTable("visualization_presets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .references(() => users.clerkId)
    .notNull(),
  name: text("name").notNull(),
  style: text("style").notNull(), // "bloom" | "sine"
  speed: real("speed").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

Requires a new Drizzle migration (`npm run db:generate` then `db:migrate`/`db:push`), following the existing workflow in `drizzle.config.ts`.

## Server actions

New file `src/app/(app)/meditate/visualization-actions.ts` (`"use server"`), same shape as `profile/actions.ts` and `meditate/[id]/actions.ts`:

```ts
export async function listVisualizationPresets(): Promise<VisualizationPreset[]>
export async function saveVisualizationPreset(
  name: string,
  style: "bloom" | "sine",
  speed: number
): Promise<VisualizationPreset>
export async function deleteVisualizationPreset(id: string): Promise<void>
```

- All three call `auth()` and throw `"Unauthorized"` if there's no `userId`, matching existing actions.
- `saveVisualizationPreset` trims `name`, rejects empty/whitespace-only names (server-side, in addition to a disabled Save button client-side), and validates `style` is one of the two known values.
- `deleteVisualizationPreset` deletes `where(and(eq(id, ...), eq(userId, ...)))` — ownership check so one user can't delete another's row via a guessed ID.
- No `revalidatePath` calls: the preset list only affects this client-side panel, not any server-rendered page.
- Called directly from the client settings panel as plain async functions (Next.js Server Actions), no API route.

## Component architecture

`src/components/breathing-dot-overlay.tsx` is renamed to `src/components/visual-overlay.tsx`. It keeps everything that's shared today — the fixed full-screen click-to-pause surface, the exit (✕) button, the paused indicator, Escape/Space/Enter keyboard handling — and adds a `style: "bloom" | "sine"` prop that picks which visual to render inside:

```ts
interface VisualOverlayProps {
  style: "bloom" | "sine";
  paused: boolean;
  onTogglePause: () => void;
  onExit: () => void;
  speed: number; // baseline/resting speed for both styles
}
```

- `src/components/dot-visual.tsx` (new) — today's dual-layer crossfade logic, extracted verbatim from the current overlay (base/max diameter constants, ease/fadeEnvelope functions, the two-layer rAF loop). No behavior change.
- `src/components/sine-wave-visual.tsx` (new) — the wave.

### Sine wave rendering

A `<canvas>` filling the overlay, resized on `window resize`. Each `requestAnimationFrame`:

1. Clear the canvas.
2. Trace `y = centerY + amplitude · sin((x + phase) · frequency)` across the width, `ctx.stroke()` it.
3. Advance `phase += elapsedMs · currentSpeed · SPEED_TO_PHASE_CONSTANT` — this is what makes the pattern scroll horizontally; it is not the wave's own oscillation frequency, which stays fixed.
4. Recompute `currentSpeed` by lerping toward a target (see below) so speed changes ease in/out rather than snapping.

Stroke color is read from `getComputedStyle(document.documentElement).getPropertyValue("--muted-foreground")` each frame (cheap) so it tracks theme changes automatically, same visual language as the dot.

### Mouse-driven speed

- Tracked via `mousemove`/`mouseenter`/`mouseleave` on the overlay's root element.
- While the mouse is inside: `targetSpeed = MIN_SPEED + clamp(mouseX / width, 0, 1) · (MAX_SPEED - MIN_SPEED)` — left edge slowest, right edge fastest, independent of the baseline slider value.
- While the mouse is outside (or on touch devices, where it never fires): `targetSpeed = speed` (the baseline prop, i.e. the existing Visual speed setting).
- `currentSpeed` lerps toward `targetSpeed` each frame (fixed factor) rather than jumping, so movement feels smooth.
- Paused: freezes `phase` (stops advancing) — mouse tracking can keep running harmlessly, it just has no visible effect while frozen, matching how the dot's rAF loop already skips its update block while paused.

### `prefers-reduced-motion`

The wave keeps scrolling — the motion is the content, same precedent as the dot's growth today, which also isn't disabled under reduced motion.

## Settings UI (`voice-settings-panel.tsx`)

- **Visual style** — new radio group, same pattern as the existing "Prefer" audio/TTS radio: "Soft Bloom" / "Sine Wave".
- **Visual speed** — existing slider, unchanged (0.01×–2×, default 1.0×). Label stays as-is; behavior differs only by consumer (full speed for Bloom, baseline for Sine Wave when the mouse isn't driving it).
- **Saved visualizations** (new section) — presets fetched via `listVisualizationPresets()` in a `useEffect` on mount into local component state (`useState<VisualizationPreset[]>([])`), not persisted globally or revalidated across the app.
  - Each row: name, a small style badge, speed value, a **Use** button, a delete icon button.
  - **Use** calls the existing `onChange({ visualStyle: preset.style, visualSpeed: preset.speed })` — the same updater the style radio and speed slider already call — so applying a preset is just writing to the existing `localStorage`-backed settings object.
  - **Delete** calls `deleteVisualizationPreset(id)` then removes the row from local state (no refetch needed).
  - A "Save current as…" text input + Save button below the list: Save button disabled while the trimmed input is empty; on submit calls `saveVisualizationPreset(name, settings.visualStyle, settings.visualSpeed)` and appends the returned row to local state, then clears the input.

## Data flow

```
Postgres (visualization_presets)
        │  list / save / delete
        ▼
visualization-actions.ts (server actions)
        │
        ▼
VoiceSettingsPanel (local list state)
        │  "Use" button
        ▼
useVoiceSettings() ──> localStorage ("mindful:voice-settings")
        │
        ▼
MeditationPlayer ──> VisualOverlay (style, speed props)
        │
        ├── DotVisual (unchanged)
        └── SineWaveVisual ── live mouse X (client-only, never persisted)
```

Two independent stores: presets live in Postgres (account-level, the saved library), the *active* style/speed live in `localStorage` (device-level, what's actually playing) exactly as `visualSpeed` does today. Applying a preset copies from one into the other; they don't stay linked afterward.

## Error handling and edge cases

- **Empty/whitespace preset name**: Save button disabled client-side; server action also rejects it (defense in depth, since server actions are directly callable).
- **Deleting an already-applied preset**: no special handling — applying copies values into `localStorage` at that moment; the two are independent afterward, so deleting the source preset later has no effect on what's currently playing.
- **Mouse leaves the overlay**: speed eases back toward baseline via the lerp, not frozen at the last in-bounds value.
- **Touch devices / no mouse**: `mousemove` simply never fires, so the wave always runs at baseline speed — no crash, no dead interaction.
- **Canvas resize**: `window resize` listener updates canvas dimensions and the next frame redraws at the new size; no stretching of stale bitmap content.
- **Not signed in**: shouldn't be reachable (meditate is behind auth already), but the actions still guard with `auth()` and throw, consistent with every other action in this codebase.
- **Duplicate preset names**: allowed, no uniqueness constraint — simplest option, nothing in the request asked for uniqueness.

## Testing

No component-test infrastructure exists in this repo (confirmed precedent in the TTS settings spec) — verification is manual, via the running dev server:

1. Open a meditation session, open settings, switch Visual style to Sine Wave — the overlay's visual swaps from circle to wave next time it's opened.
2. Move the mouse left/right across the open wave visual — speed visibly responds; move it off the visual — speed eases back to the baseline slider value.
3. Click to pause/resume, exit via ✕ and via Escape — same behavior as the dot today, for both styles.
4. Save a preset with a custom name; reload the page; open settings again — the preset is still listed (proves the DB round-trip, not just in-memory state).
5. Apply a saved preset — style/speed update immediately, both in the settings panel and the next time the overlay opens.
6. Delete a preset — it disappears from the list; re-list (reload) confirms it's actually gone server-side, not just hidden client-side.
7. Check both styles in light and dark theme.
8. Resize the browser window while the sine wave is open — no stretched/broken canvas frame.

## Files touched

- `src/db/schema.ts` (new table)
- new Drizzle migration
- `src/app/(app)/meditate/visualization-actions.ts` (new)
- `src/components/visual-overlay.tsx` (renamed from `breathing-dot-overlay.tsx`, generalized)
- `src/components/dot-visual.tsx` (new, extracted unchanged)
- `src/components/sine-wave-visual.tsx` (new)
- `src/lib/voice-settings.ts` (add `visualStyle` field)
- `src/components/voice-settings-panel.tsx` (style picker + presets manager)
- `src/components/meditation-player.tsx` (pass `style` prop, updated import)
