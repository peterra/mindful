# "Name It" — Design Spec

## Overview

A new standalone page in the Mindful app that helps users name their current feeling through a small ritual: build a bouquet of flowers into a pair of illustrated hands, then name the feeling the bouquet represents. Entries are saved with a timestamp so users can check in multiple times a day and look back over how they've been feeling.

## Art & Copyright

The page opens on an illustration of two cupped hands holding a bouquet, inspired by the visual language of Pablo Picasso's 1958 lithograph "Bouquet of Peace" (continuous-line contour drawing, loose scribble/burst flower heads). Because the source painting is still under copyright, the illustration used in the app must be **original artwork inspired by that style** — not a reproduction, scan, or trace of the actual painting. This applies to the composition and any promotional use of the page.

**Placeholder status:** the hand illustration explored during design (a single continuous-outline "comb" technique — up one side of a finger, over the tip, down into the valley between fingers, repeat, with a thumb bulge and curled fingertips gripping the stem bundle) is a rough sketch produced via hand-typed SVG coordinates. It establishes the *concept and technique* but needs a real illustration or vector-art pass (designer or image-generation tool) before shipping. Implementation should not treat the sketched path data as final asset code.

## Placement & Route

- New route, e.g. `/name-it`
- Standalone — reachable from the dashboard and/or main nav, independent of the meditation session flow (not tied to `mood_before`/`mood_after` on `sessions`)

## Page Layout & Flow — "Single Scene"

The whole interaction happens on one continuous canvas with no page-to-page navigation:

1. **Empty hands.** Illustration centered, large. Prompt: "What are you feeling right now? Add some flowers."
2. **Flower tray.** A tray of 5 flower-color swatches slides up from the bottom. Tapping a color adds an illustrated flower (with stem) into the hands, building a bouquet. Tapping an already-placed flower removes it. Soft cap of 8–10 flowers total to keep the illustration legible.
3. **Naming step.** Once at least one flower is placed, the user can proceed; the tray area morphs in place (same canvas, no navigation) into:
   - A free-text input: "What would you name this feeling?"
   - A "need help naming it?" affordance that reveals a curated emotion-wheel word bank as tappable chips (e.g. grouped like: joyful, grateful, calm / anxious, overwhelmed, uneasy / sad, lonely, tender / angry, frustrated / hopeful, curious — exact word list to be finalized during implementation, no AI generation involved)
   - Typing text and tapping a chip are not mutually exclusive — a chip tap can populate/append to the text input
4. **Submit.** A brief, gentle confirmation (e.g. the finished bouquet + the named feeling shown for a moment), then the page resets to the empty-hands state (step 1) so the user can check in again the same day if they want.

## Flowers

- 5 colors, purely decorative (no emotion mapping): rose red, amber yellow, sage green, lavender purple, blush white
- Each tap draws a small illustrated flower (petals + center + stem) in the chosen color into the hands, stems converging toward the grip point and fanning out so the bouquet fills naturally rather than stacking
- No limit-enforcing error state needed — once the soft cap (8–10) is reached, further taps on new colors are simply disabled/no-op (existing flowers can still be removed to make room)

## Persistence & Data Model

Every submission is saved — no daily limit, multiple entries per day are expected and normal. New table, following the conventions in `src/db/schema.ts`:

```ts
export const feelingEntries = pgTable("feeling_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .references(() => users.clerkId)
    .notNull(),
  flowerColors: text("flower_colors").array().notNull(), // e.g. ["rose", "amber", "sage"]
  feelingText: text("feeling_text").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

- `flowerColors`: ordered array of the color keys placed in the bouquet (order = placement order), purely for rendering a mini bouquet thumbnail in history later
- `feelingText`: whatever the user typed and/or selected from the word bank, stored as final free text (chip taps just populate the same field)

## History View

A dedicated "past entries" view lives within the Name It page itself (not merged into the existing Progress page). Shows prior entries newest-first, each with its timestamp, a small rendering of the flower colors chosen, and the named feeling text. No editing/deleting in v1 — read-only log.

## Error Handling

- Save failure on submit: keep the user's bouquet and text in place, show an inline retry rather than losing their input (consistent with the app's existing pattern of graceful, encouraging error states)
- Empty state on the history view: encouraging message (e.g. "Nothing named yet — try adding your first flower.") rather than a blank screen, consistent with existing app conventions

## Future Considerations (not v1)

- Surfacing feeling-entry trends on the Progress page (e.g. a mini timeline alongside streaks/achievements)
- AI-assisted naming suggestions (explicitly deferred — v1 uses a static curated word bank only)
- Editing or deleting past entries
- Finalized, professionally illustrated hand/flower artwork replacing the placeholder sketch
