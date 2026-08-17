# Name It Haze Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an optional "haze" layer to the Name It page — a single-toggle, intensity-adjustable blurred cloud over the bouquet illustration, expressing feelings flowers alone don't capture (fog, numbness, overwhelm), persisted with each entry.

**Architecture:** Extends the existing Name It feature (`docs/superpowers/specs/2026-08-14-name-it-design.md`, implemented in `docs/superpowers/plans/2026-08-14-name-it.md`) rather than introducing new architecture. A new `hasHaze`/`hazeIntensity` pair of columns on `feeling_entries`. Pure color/opacity interpolation math lives in `src/lib/name-it-layout.ts` (already the shared source of truth for flower logic) so it's unit-testable without React. The illustration, tray, and a new slider component consume that math; `client.tsx` owns the toggle/intensity state and the save call.

**Tech Stack:** Same as the base plan — Next.js 16 App Router, Drizzle ORM + Neon Postgres, Vitest (already set up).

## Global Constraints

- Haze is a single on/off toggle, not stackable (confirmed design decision — do not implement repeated-tap intensity building).
- Ellipse geometry, in the illustration's existing `viewBox="0 0 300 280"` space: `cx=145 cy=120 rx=65 ry=50`. Do not move this closer to any edge — this exact placement was chosen so the blurred falloff stays inside the canvas at every intensity; closer placements clip visibly.
- Blur filter: `feGaussianBlur stdDeviation=18`, filter region `x=-50% y=-50% width=200% height=200%`.
- Color interpolation across intensity 0–100: fill color from `#e8e8e8` (light) to `#4a4a4a` (dark); opacity from `0.25` (light) to `0.7` (dark). Linear interpolation on both.
- Default intensity when toggled on: `50`.
- Render order: haze ellipse is the topmost layer in the SVG — drawn after the flower stems/bursts *and* after both hand paths.
- Gating rule: the "Continue" button (building → naming) shows when `flowers.length > 0 OR hasHaze` — haze alone is a valid, saveable entry.
- Persistence: `hasHaze: boolean` (default `false`, not null) and `hazeIntensity: integer | null` (null whenever `hasHaze` is false) on `feeling_entries`.
- History view shows a small visual indicator for entries with `hasHaze`, alongside the existing flower-color dots.
- New DB columns are applied with `npm run db:push` (this repo has no `drizzle/` migrations directory — see the base plan's Global Constraints).

---

### Task 1: Database schema — haze columns

**Files:**
- Modify: `src/db/schema.ts`

**Interfaces:**
- Produces: `feelingEntries.hasHaze` (boolean, not null, default false) and `feelingEntries.hazeIntensity` (integer, nullable), consumed by Task 7 (`actions.ts`) and Task 8 (`page.tsx`).

- [ ] **Step 1: Add the columns**

In `src/db/schema.ts`, find the `feelingEntries` table (added in the base plan) and add two columns after `feelingText`:

```ts
export const feelingEntries = pgTable("feeling_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .references(() => users.clerkId)
    .notNull(),
  flowerColors: text("flower_colors").array().notNull(),
  feelingText: text("feeling_text").notNull(),
  hasHaze: boolean("has_haze").default(false).notNull(),
  hazeIntensity: integer("haze_intensity"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

(`boolean` and `integer` are already imported at the top of the file from the base plan — no import changes needed.)

- [ ] **Step 2: Push the schema change**

Run: `npm run db:push`
Expected: drizzle-kit reports the `has_haze` and `haze_intensity` columns being added to `feeling_entries`, no errors.

- [ ] **Step 3: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no new type errors.

- [ ] **Step 4: Commit**

```bash
git add src/db/schema.ts
git commit -m "feat: add haze columns to feeling_entries"
```

---

### Task 2: Haze math and shared constants — `src/lib/name-it-layout.ts`

**Files:**
- Modify: `src/lib/name-it-layout.ts`
- Modify: `src/lib/name-it-layout.test.ts`

**Interfaces:**
- Produces (consumed by Tasks 3, 4, 5, 6, 7, 8, 9):
  - `const MIN_HAZE_INTENSITY = 0`, `const MAX_HAZE_INTENSITY = 100`, `const DEFAULT_HAZE_INTENSITY = 50`
  - `const HAZE_ELLIPSE: { cx: number; ry: number; rx: number; cy: number }` — `{ cx: 145, cy: 120, rx: 65, ry: 50 }`
  - `const HAZE_BLUR_STD_DEVIATION = 18`
  - `function getHazeColor(intensity: number): string`
  - `function getHazeOpacity(intensity: number): number`
  - `interface FeelingEntrySummary` gains `hasHaze: boolean; hazeIntensity: number | null;`
  - `isValidFlowerColors` no longer requires a non-empty array (haze-only entries have `flowerColors: []`)

- [ ] **Step 1: Update the existing `isValidFlowerColors` test (RED)**

In `src/lib/name-it-layout.test.ts`, find the `isValidFlowerColors` describe block and replace the "rejects an empty array" test with an "accepts" test, since flowers are no longer required on their own (haze can carry an entry alone):

```ts
describe("isValidFlowerColors", () => {
  it("accepts a valid non-empty array of known colors", () => {
    expect(isValidFlowerColors(["rose", "amber"])).toBe(true);
  });

  it("accepts an empty array", () => {
    expect(isValidFlowerColors([])).toBe(true);
  });

  it("rejects an array longer than MAX_FLOWERS", () => {
    const tooMany = Array(MAX_FLOWERS + 1).fill("rose");
    expect(isValidFlowerColors(tooMany)).toBe(false);
  });

  it("rejects an array containing an unknown color", () => {
    expect(isValidFlowerColors(["rose", "chartreuse"])).toBe(false);
  });

  it("rejects a non-array value", () => {
    expect(isValidFlowerColors("rose")).toBe(false);
  });
});
```

- [ ] **Step 2: Add the new haze tests (RED)**

In the same file, add these imports to the existing `import { ... } from "./name-it-layout"` line: `getHazeColor, getHazeOpacity`. Then add:

```ts
describe("getHazeColor", () => {
  it("returns the light color at intensity 0", () => {
    expect(getHazeColor(0)).toBe("#e8e8e8");
  });

  it("returns the dark color at intensity 100", () => {
    expect(getHazeColor(100)).toBe("#4a4a4a");
  });

  it("returns the midpoint color at intensity 50", () => {
    expect(getHazeColor(50)).toBe("#999999");
  });

  it("clamps intensity above 100 to the same result as 100", () => {
    expect(getHazeColor(150)).toBe(getHazeColor(100));
  });

  it("clamps intensity below 0 to the same result as 0", () => {
    expect(getHazeColor(-20)).toBe(getHazeColor(0));
  });
});

describe("getHazeOpacity", () => {
  it("returns 0.25 at intensity 0", () => {
    expect(getHazeOpacity(0)).toBeCloseTo(0.25);
  });

  it("returns 0.7 at intensity 100", () => {
    expect(getHazeOpacity(100)).toBeCloseTo(0.7);
  });

  it("returns the midpoint at intensity 50", () => {
    expect(getHazeOpacity(50)).toBeCloseTo(0.475);
  });
});
```

- [ ] **Step 3: Run tests to verify the new/changed ones fail**

Run: `npm test`
Expected: FAIL — `getHazeColor`/`getHazeOpacity` are not exported yet, and the "accepts an empty array" test fails against the current `isValidFlowerColors` (which still requires `length >= 1`).

- [ ] **Step 4: Implement the changes**

In `src/lib/name-it-layout.ts`:

1. Remove the `colors.length >= 1 &&` line from `isValidFlowerColors` so it reads:

```ts
export function isValidFlowerColors(
  colors: unknown
): colors is FlowerColorId[] {
  return (
    Array.isArray(colors) &&
    colors.length <= MAX_FLOWERS &&
    colors.every((c) => typeof c === "string" && isFlowerColorId(c))
  );
}
```

2. Add haze constants and math after `getStemPath` and before the `FeelingEntrySummary` interface:

```ts
export const MIN_HAZE_INTENSITY = 0;
export const MAX_HAZE_INTENSITY = 100;
export const DEFAULT_HAZE_INTENSITY = 50;

export const HAZE_ELLIPSE = { cx: 145, cy: 120, rx: 65, ry: 50 };
export const HAZE_BLUR_STD_DEVIATION = 18;

const HAZE_LIGHT_HEX = "#e8e8e8";
const HAZE_DARK_HEX = "#4a4a4a";
const HAZE_LIGHT_OPACITY = 0.25;
const HAZE_DARK_OPACITY = 0.7;

function clampHazeIntensity(intensity: number): number {
  return Math.min(MAX_HAZE_INTENSITY, Math.max(MIN_HAZE_INTENSITY, intensity));
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b]
    .map((v) => Math.round(v).toString(16).padStart(2, "0"))
    .join("")}`;
}

export function getHazeColor(intensity: number): string {
  const n = clampHazeIntensity(intensity) / 100;
  const [lr, lg, lb] = hexToRgb(HAZE_LIGHT_HEX);
  const [dr, dg, db] = hexToRgb(HAZE_DARK_HEX);
  return rgbToHex(lr + (dr - lr) * n, lg + (dg - lg) * n, lb + (db - lb) * n);
}

export function getHazeOpacity(intensity: number): number {
  const n = clampHazeIntensity(intensity) / 100;
  return HAZE_LIGHT_OPACITY + (HAZE_DARK_OPACITY - HAZE_LIGHT_OPACITY) * n;
}
```

3. Update the `FeelingEntrySummary` interface at the bottom of the file:

```ts
export interface FeelingEntrySummary {
  id: string;
  flowerColors: FlowerColorId[];
  feelingText: string;
  createdAt: string;
  hasHaze: boolean;
  hazeIntensity: number | null;
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test`
Expected: PASS — all tests green, including the updated `isValidFlowerColors` block and the new haze tests.

- [ ] **Step 6: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors yet from this file in isolation (downstream callers of `FeelingEntrySummary`/`saveFeelingEntry` will show errors until Tasks 7–9 catch up — that's expected mid-plan and resolves by Task 9).

- [ ] **Step 7: Commit**

```bash
git add src/lib/name-it-layout.ts src/lib/name-it-layout.test.ts
git commit -m "feat: add haze color/opacity math and update flower validation"
```

---

### Task 3: Render the haze layer — `NameItHands`

**Files:**
- Modify: `src/components/name-it-hands.tsx`

**Interfaces:**
- Consumes: `HAZE_ELLIPSE`, `HAZE_BLUR_STD_DEVIATION`, `getHazeColor`, `getHazeOpacity` from `@/lib/name-it-layout` (Task 2)
- Produces (consumed by Task 9): `NameItHandsProps` gains `hasHaze: boolean; hazeIntensity: number;`

- [ ] **Step 1: Update the component**

In `src/components/name-it-hands.tsx`, update the import line to add the new names:

```tsx
import {
  FLOWER_COLORS,
  getFlowerSlotPosition,
  getStemPath,
  getHazeColor,
  getHazeOpacity,
  HAZE_ELLIPSE,
  HAZE_BLUR_STD_DEVIATION,
  type FlowerColorId,
} from "@/lib/name-it-layout";
```

Update the props interface and function signature:

```tsx
interface NameItHandsProps {
  flowers: FlowerColorId[];
  onRemoveFlower: (index: number) => void;
  hasHaze: boolean;
  hazeIntensity: number;
}

export function NameItHands({
  flowers,
  onRemoveFlower,
  hasHaze,
  hazeIntensity,
}: NameItHandsProps) {
```

Add a `<defs>` block right after the opening `<svg ...>` tag (before the `{flowers.map(...)}` block), and add the haze `<ellipse>` as the very last child of the `<svg>`, after both hand `<path>` elements:

```tsx
      <defs>
        <filter
          id="name-it-haze-blur"
          x="-50%"
          y="-50%"
          width="200%"
          height="200%"
        >
          <feGaussianBlur stdDeviation={HAZE_BLUR_STD_DEVIATION} />
        </filter>
      </defs>

      {flowers.map((color, i) => {
```

```tsx
      <path
        d={HAND_PATH}
        fill="none"
        stroke="#3a3a3a"
        strokeWidth={1.8}
        strokeLinejoin="round"
        transform="translate(195,120) rotate(-90)"
      />

      {hasHaze && (
        <ellipse
          cx={HAZE_ELLIPSE.cx}
          cy={HAZE_ELLIPSE.cy}
          rx={HAZE_ELLIPSE.rx}
          ry={HAZE_ELLIPSE.ry}
          fill={getHazeColor(hazeIntensity)}
          opacity={getHazeOpacity(hazeIntensity)}
          filter="url(#name-it-haze-blur)"
        />
      )}
    </svg>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: this file shows no new errors (its only caller, `client.tsx`, is updated in Task 9 — until then it will show a missing-props error there, which is expected mid-plan).

- [ ] **Step 3: Commit**

```bash
git add src/components/name-it-hands.tsx
git commit -m "feat: render haze layer in the hands illustration"
```

---

### Task 4: Haze intensity slider — `NameItHazeSlider`

**Files:**
- Create: `src/components/name-it-haze-slider.tsx`

**Interfaces:**
- Consumes: `MIN_HAZE_INTENSITY`, `MAX_HAZE_INTENSITY` from `@/lib/name-it-layout` (Task 2)
- Produces (consumed by Task 9): `function NameItHazeSlider(props: { value: number; onChange: (value: number) => void }): JSX.Element`

- [ ] **Step 1: Implement the component**

Create `src/components/name-it-haze-slider.tsx`:

```tsx
"use client";

import { MIN_HAZE_INTENSITY, MAX_HAZE_INTENSITY } from "@/lib/name-it-layout";

interface NameItHazeSliderProps {
  value: number;
  onChange: (value: number) => void;
}

export function NameItHazeSlider({ value, onChange }: NameItHazeSliderProps) {
  return (
    <div className="mx-auto flex max-w-xs flex-col items-center gap-2">
      <p className="text-xs text-muted-foreground">Haze</p>
      <input
        type="range"
        min={MIN_HAZE_INTENSITY}
        max={MAX_HAZE_INTENSITY}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label="Haze intensity"
        className="w-full accent-foreground"
      />
      <div className="flex w-full justify-between text-[10px] text-muted-foreground">
        <span>Lighter</span>
        <span>Darker</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/name-it-haze-slider.tsx
git commit -m "feat: add Name It haze intensity slider component"
```

---

### Task 5: Haze toggle in the tray — `NameItFlowerTray`

**Files:**
- Modify: `src/components/name-it-flower-tray.tsx`

**Interfaces:**
- Consumes: `Cloud` icon from `lucide-react`; `cn` from `@/lib/utils`
- Produces (consumed by Task 9): `NameItFlowerTrayProps` gains `hasHaze: boolean; onToggleHaze: () => void;`

- [ ] **Step 1: Update the component**

Replace the full contents of `src/components/name-it-flower-tray.tsx`:

```tsx
"use client";

import { Cloud } from "lucide-react";
import { FLOWER_COLORS, MAX_FLOWERS, type FlowerColorId } from "@/lib/name-it-layout";
import { cn } from "@/lib/utils";

interface NameItFlowerTrayProps {
  flowers: FlowerColorId[];
  onAdd: (color: FlowerColorId) => void;
  hasHaze: boolean;
  onToggleHaze: () => void;
}

export function NameItFlowerTray({
  flowers,
  onAdd,
  hasHaze,
  onToggleHaze,
}: NameItFlowerTrayProps) {
  const atCap = flowers.length >= MAX_FLOWERS;

  return (
    <div className="flex flex-col items-center gap-3">
      <p className="text-sm text-muted-foreground">
        {atCap ? "Your bouquet is full" : "Tap a color to add a flower"}
      </p>
      <div className="flex gap-3 rounded-full bg-card px-4 py-3 shadow-sm">
        {FLOWER_COLORS.map((color) => (
          <button
            key={color.id}
            type="button"
            aria-label={`Add a ${color.label.toLowerCase()} flower`}
            disabled={atCap}
            onClick={() => onAdd(color.id)}
            className="h-8 w-8 rounded-full ring-offset-2 transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:scale-100"
            style={{ backgroundColor: color.hex }}
          />
        ))}
        <button
          type="button"
          aria-label={hasHaze ? "Remove haze" : "Add haze"}
          aria-pressed={hasHaze}
          onClick={onToggleHaze}
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-transform hover:scale-110",
            hasHaze && "border-foreground bg-muted text-foreground"
          )}
        >
          <Cloud className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no new errors from this file (its caller, `client.tsx`, is updated in Task 9).

- [ ] **Step 3: Commit**

```bash
git add src/components/name-it-flower-tray.tsx
git commit -m "feat: add haze toggle button to the flower tray"
```

---

### Task 6: Haze indicator in history — `NameItHistory`

**Files:**
- Modify: `src/components/name-it-history.tsx`

**Interfaces:**
- Consumes: `Cloud` icon from `lucide-react` (added alongside existing `Trash2` import); `FeelingEntrySummary.hasHaze` (Task 2)
- Produces: no new props — `FeelingEntrySummary` already carries `hasHaze`/`hazeIntensity` from Task 2, this task only changes rendering

- [ ] **Step 1: Update the component**

In `src/components/name-it-history.tsx`, update the icon import:

```tsx
import { Cloud, Trash2 } from "lucide-react";
```

In the entry list, add a haze indicator right after the flower-color dots `</div>` and before the `<div className="flex-1">` block:

```tsx
              <div className="flex -space-x-1">
                {entry.flowerColors.map((colorId, i) => {
                  const color = FLOWER_COLORS.find((c) => c.id === colorId);
                  return (
                    <span
                      key={i}
                      className="h-4 w-4 rounded-full ring-2 ring-card"
                      style={{ backgroundColor: color?.hex }}
                    />
                  );
                })}
                {entry.hasHaze && (
                  <span
                    aria-label="Had haze"
                    className="flex h-4 w-4 items-center justify-center rounded-full bg-muted ring-2 ring-card"
                  >
                    <Cloud className="h-2.5 w-2.5 text-muted-foreground" />
                  </span>
                )}
              </div>
```

(This replaces the existing `<div className="flex -space-x-1">...</div>` block — same opening/closing structure, with the new conditional block inserted before its closing `</div>`.)

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/name-it-history.tsx
git commit -m "feat: show haze indicator on past entries"
```

---

### Task 7: Persist haze — `saveFeelingEntry`

**Files:**
- Modify: `src/app/(app)/name-it/actions.ts`

**Interfaces:**
- Consumes: `feelingEntries.hasHaze`/`hazeIntensity` (Task 1); `MIN_HAZE_INTENSITY`, `MAX_HAZE_INTENSITY` (Task 2)
- Produces (consumed by Task 9): `saveFeelingEntry` signature becomes `(flowerColors: FlowerColorId[], feelingText: string, hasHaze: boolean, hazeIntensity: number | null): Promise<FeelingEntrySummary>`

- [ ] **Step 1: Update the action**

Replace the full contents of `src/app/(app)/name-it/actions.ts`:

```ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { and, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { feelingEntries } from "@/db/schema";
import {
  isValidFlowerColors,
  MIN_HAZE_INTENSITY,
  MAX_HAZE_INTENSITY,
  type FlowerColorId,
  type FeelingEntrySummary,
} from "@/lib/name-it-layout";

export async function saveFeelingEntry(
  flowerColors: FlowerColorId[],
  feelingText: string,
  hasHaze: boolean,
  hazeIntensity: number | null
): Promise<FeelingEntrySummary> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const trimmed = feelingText.trim();
  if (!trimmed) throw new Error("Feeling text is required");
  if (trimmed.length > 200) throw new Error("Feeling text is too long");
  if (!isValidFlowerColors(flowerColors)) {
    throw new Error("Invalid flower selection");
  }
  if (flowerColors.length === 0 && !hasHaze) {
    throw new Error("Add at least a flower or haze before saving");
  }
  if (
    hasHaze &&
    (typeof hazeIntensity !== "number" ||
      hazeIntensity < MIN_HAZE_INTENSITY ||
      hazeIntensity > MAX_HAZE_INTENSITY)
  ) {
    throw new Error("Invalid haze intensity");
  }

  const db = getDb();
  const [row] = await db
    .insert(feelingEntries)
    .values({
      userId,
      flowerColors,
      feelingText: trimmed,
      hasHaze,
      hazeIntensity: hasHaze ? hazeIntensity : null,
    })
    .returning();

  return {
    id: row.id,
    flowerColors: row.flowerColors as FlowerColorId[],
    feelingText: row.feelingText,
    createdAt: row.createdAt.toISOString(),
    hasHaze: row.hasHaze,
    hazeIntensity: row.hazeIntensity,
  };
}

export async function deleteFeelingEntry(id: string): Promise<void> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const db = getDb();
  await db
    .delete(feelingEntries)
    .where(and(eq(feelingEntries.id, id), eq(feelingEntries.userId, userId)));
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no new errors from this file (its caller, `client.tsx`, is updated in Task 9).

- [ ] **Step 3: Commit**

```bash
git add "src/app/(app)/name-it/actions.ts"
git commit -m "feat: persist haze with saved feeling entries"
```

---

### Task 8: Load haze in the page — `page.tsx`

**Files:**
- Modify: `src/app/(app)/name-it/page.tsx`

**Interfaces:**
- Consumes: `feelingEntries.hasHaze`/`hazeIntensity` (Task 1), `FeelingEntrySummary` (Task 2)
- Produces: `initialEntries` passed to `NameItClient` now carries `hasHaze`/`hazeIntensity` per entry

- [ ] **Step 1: Update the mapping**

In `src/app/(app)/name-it/page.tsx`, update the `initialEntries` mapping to include the two new fields:

```tsx
  const initialEntries: FeelingEntrySummary[] = rows.map((row) => ({
    id: row.id,
    flowerColors: row.flowerColors as FlowerColorId[],
    feelingText: row.feelingText,
    createdAt: row.createdAt.toISOString(),
    hasHaze: row.hasHaze,
    hazeIntensity: row.hazeIntensity,
  }));
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no new errors.

- [ ] **Step 3: Commit**

```bash
git add "src/app/(app)/name-it/page.tsx"
git commit -m "feat: load haze fields for Name It history"
```

---

### Task 9: Wire haze state into the client — `client.tsx`

Ties every earlier piece together and is the first point the feature is reachable end-to-end, so verification here is a full manual walkthrough.

**Files:**
- Modify: `src/app/(app)/name-it/client.tsx`

**Interfaces:**
- Consumes: `NameItHands` (Task 3, new props), `NameItHazeSlider` (Task 4), `NameItFlowerTray` (Task 5, new props), `NameItHistory` (Task 6), `saveFeelingEntry` (Task 7, new signature), `DEFAULT_HAZE_INTENSITY` (Task 2)
- Produces: nothing consumed elsewhere — this is the final integration point for this plan

- [ ] **Step 1: Update the client component**

Replace the full contents of `src/app/(app)/name-it/client.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import { NameItHands } from "@/components/name-it-hands";
import { NameItFlowerTray } from "@/components/name-it-flower-tray";
import { NameItHazeSlider } from "@/components/name-it-haze-slider";
import { NameItNamingStep } from "@/components/name-it-naming-step";
import { NameItHistory } from "@/components/name-it-history";
import { Button } from "@/components/ui/button";
import { saveFeelingEntry, deleteFeelingEntry } from "./actions";
import {
  DEFAULT_HAZE_INTENSITY,
  type FeelingEntrySummary,
  type FlowerColorId,
} from "@/lib/name-it-layout";

interface NameItClientProps {
  initialEntries: FeelingEntrySummary[];
}

type Phase = "building" | "naming" | "confirmation";

export function NameItClient({ initialEntries }: NameItClientProps) {
  const [flowers, setFlowers] = useState<FlowerColorId[]>([]);
  const [hasHaze, setHasHaze] = useState(false);
  const [hazeIntensity, setHazeIntensity] = useState(DEFAULT_HAZE_INTENSITY);
  const [phase, setPhase] = useState<Phase>("building");
  const [feelingText, setFeelingText] = useState("");
  const [entries, setEntries] = useState(initialEntries);
  const [showHistory, setShowHistory] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const [saveError, setSaveError] = useState<string | null>(null);

  function handleAdd(color: FlowerColorId) {
    setFlowers((prev) => [...prev, color]);
  }

  function handleRemove(index: number) {
    setFlowers((prev) => prev.filter((_, i) => i !== index));
  }

  function handleClearFlowers() {
    setFlowers([]);
  }

  function handleToggleHaze() {
    setHasHaze((prev) => !prev);
  }

  function handleSubmit() {
    const trimmed = feelingText.trim();
    if (!trimmed) return;
    setSaveError(null);
    startSaving(async () => {
      try {
        const entry = await saveFeelingEntry(
          flowers,
          trimmed,
          hasHaze,
          hasHaze ? hazeIntensity : null
        );
        setEntries((prev) => [entry, ...prev]);
        setPhase("confirmation");
      } catch {
        // Bouquet, haze, and text are left untouched so the user can just retry.
        setSaveError("Couldn't save that — check your connection and try again.");
      }
    });
  }

  function handleReset() {
    setFlowers([]);
    setHasHaze(false);
    setHazeIntensity(DEFAULT_HAZE_INTENSITY);
    setFeelingText("");
    setPhase("building");
  }

  async function handleDelete(id: string) {
    try {
      await deleteFeelingEntry(id);
      setEntries((prev) => prev.filter((entry) => entry.id !== id));
    } catch {
      alert("Couldn't delete that entry — check your connection and try again.");
    }
  }

  if (showHistory) {
    return (
      <NameItHistory
        entries={entries}
        onBack={() => setShowHistory(false)}
        onDelete={handleDelete}
      />
    );
  }

  const canContinue = flowers.length > 0 || hasHaze;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Name It</h1>
        <Button variant="outline" size="sm" onClick={() => setShowHistory(true)}>
          Past entries
        </Button>
      </div>

      <NameItHands
        flowers={flowers}
        onRemoveFlower={handleRemove}
        hasHaze={hasHaze}
        hazeIntensity={hazeIntensity}
      />

      {phase === "building" && (
        <div className="space-y-4">
          <p className="text-center text-sm text-muted-foreground">
            {flowers.length === 0 && !hasHaze
              ? "What are you feeling right now? Add some flowers."
              : "Add more, or continue when you're ready."}
          </p>
          <NameItFlowerTray
            flowers={flowers}
            onAdd={handleAdd}
            hasHaze={hasHaze}
            onToggleHaze={handleToggleHaze}
          />
          {hasHaze && (
            <NameItHazeSlider value={hazeIntensity} onChange={setHazeIntensity} />
          )}
          {canContinue && (
            <div className="flex justify-center gap-3">
              {flowers.length > 0 && (
                <Button variant="outline" onClick={handleClearFlowers}>
                  Clear
                </Button>
              )}
              <Button onClick={() => setPhase("naming")}>Continue</Button>
            </div>
          )}
        </div>
      )}

      {phase === "naming" && (
        <div className="space-y-3">
          <NameItNamingStep
            value={feelingText}
            onChange={setFeelingText}
            onSubmit={handleSubmit}
            isSaving={isSaving}
          />
          {saveError && (
            <p className="text-center text-sm text-destructive">{saveError}</p>
          )}
        </div>
      )}

      {phase === "confirmation" && (
        <div className="space-y-4 text-center">
          <p className="text-lg font-medium">
            You named this feeling &ldquo;{feelingText}&rdquo;
          </p>
          <Button onClick={handleReset}>Name another feeling</Button>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Verify everything compiles**

Run: `npx tsc --noEmit`
Expected: no errors anywhere in the project — this is the task where all the mid-plan "expected" errors from Tasks 3, 5, and 7 resolve.

- [ ] **Step 3: Run the full test suite**

Run: `npm test`
Expected: all tests pass (the existing 15 from the base plan, plus the ones added/changed in Task 2).

- [ ] **Step 4: Manual end-to-end verification**

With the dev server running (`npm run dev`, http://localhost:3333 — or whatever port is free), sign in and open http://localhost:3333/name-it, then:
1. Confirm the tray now shows the 7 flower-color swatches plus an 8th cloud-icon "haze" button.
2. Tap the haze button; confirm a blurred gray cloud appears over the illustration (not clipped at any edge) and a "Lighter / Darker" slider appears below the tray.
3. Drag the slider toward "Darker"; confirm the cloud visibly darkens and becomes more opaque in real time.
4. Tap "Continue" with haze on and zero flowers; confirm it's allowed (gating rule: haze alone counts).
5. Go back, tap the haze button again to turn it off; confirm the cloud disappears and the slider is hidden.
6. Add 2 flowers and turn haze back on; tap "Continue" → name the feeling → "Save".
7. Confirm the reset after save clears the haze back off (tap "Name another feeling", verify empty hands with no cloud).
8. Open "Past entries"; confirm the saved entry shows a small cloud indicator alongside its flower-color dots.
9. Reload the page; confirm the haze indicator on that entry persisted (proves it saved to Postgres).

- [ ] **Step 5: Commit**

```bash
git add "src/app/(app)/name-it/client.tsx"
git commit -m "feat: wire haze toggle and intensity into the Name It client"
```
