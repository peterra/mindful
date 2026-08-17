# "Name It" — Haze Addendum

Extends the existing spec at `2026-08-14-name-it-design.md`. Covers the cloud/haze feature added after the original page shipped.

## What it represents

An expressive element alongside the flower bouquet — not decorative. Represents feelings like fog, numbness, confusion, or overwhelm that flowers alone don't capture. Purely visual; no separate emotion-word mapping (same "decorative, no forced taxonomy" stance as the flower colors).

## Interaction

- A 6th swatch in the flower tray, styled like the flower color swatches but showing a small gray/blur icon instead of a color dot, labeled "Haze"
- Tapping it is a single on/off toggle — not stackable like flowers (confirmed: user chose single toggle over repeated-tap intensity)
- When toggled on, a horizontal slider appears beneath the tray, labeled "Lighter — Darker", defaulting to the midpoint (50)
- Dragging the slider adjusts the haze in place on the illustration in real time
- Tapping the swatch again while haze is on removes it (and hides the slider)

## Visual treatment

A single blurred, filled ellipse layered on top of the flowers/stems (drawn after them, before nothing — i.e. it's the topmost layer), positioned to drift over part of the scene rather than being centered or covering everything:

- Ellipse: `cx=145 cy=120 rx=65 ry=50` in the illustration's existing `viewBox="0 0 300 280"` coordinate space
- Gaussian blur filter, `stdDeviation=18`, filter region `x/y=-50% width/height=200%`
- This exact placement keeps the blurred falloff comfortably inside the canvas at every intensity level — closer placements (tested during design) caused the soft edge to hit the canvas boundary and clip hard instead of fading to nothing. Do not move this ellipse closer to any edge without re-checking against the viewBox bounds.

**Slider → visual mapping** (slider value `t` from 0–100, normalized to `n = t / 100`):

| | Light (t=0) | Dark (t=100) |
|---|---|---|
| Fill color | `#e8e8e8` | `#4a4a4a` |
| Opacity | `0.25` | `0.7` |

Interpolate both fill color (per RGB channel) and opacity linearly by `n`. The default `t=50` should land close to the "medium" reference: `#c9c9c9`-ish fill, `~0.55` opacity.

## Persistence

Saved with the entry, alongside `flowerColors` and `feelingText`, so history reflects whether haze was present:

```ts
hasHaze: boolean("has_haze").default(false).notNull(),
hazeIntensity: integer("haze_intensity"), // 0-100, null when hasHaze is false
```

- `hazeIntensity` is only meaningful (non-null) when `hasHaze` is true
- History view should render a small visual indicator (e.g. a faint gray dot or icon) alongside the flower-color dots for entries that had haze, so past entries are distinguishable at a glance — exact treatment left to implementation, no slider needed in the read-only history view

## Gating rule

The "Continue" button (building → naming) currently shows only when `flowers.length > 0`. With haze added, an entry can be expressed through haze alone: show "Continue" when `flowers.length > 0 OR hasHaze`. Same rule applies to whatever currently decides the entry is non-empty before save.

## Out of scope

- No emotion-word mapping tied to haze
- No stacking/multiple haze layers
