# Visualization Styles, Mouse-Driven Sine Wave, and Saved Presets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a second full-screen meditation visual (a mouse-reactive scrolling sine wave) alongside the existing breathing dot, and let users save/select/delete named visualization presets (style + speed) tied to their account.

**Architecture:** Split the existing `breathing-dot-overlay.tsx` into a generic `VisualOverlay` shell plus two swappable visual components (`DotVisual`, new `SineWaveVisual`). The sine wave is Canvas 2D, driven by a `requestAnimationFrame` loop with mouse-X-driven speed. Presets are a new Postgres table queried via Next.js Server Actions, following this repo's existing `"use server"` + Clerk `auth()` + Drizzle pattern (see `src/app/(app)/name-it/actions.ts`).

**Tech Stack:** Next.js App Router, React (client components), Drizzle ORM (`drizzle-orm/neon-http`), Clerk auth, Canvas 2D, Vitest.

**Spec:** `docs/superpowers/specs/2026-08-24-visualization-styles-and-presets-design.md`

## Global Constraints

- Presets store exactly `name`, `style` (`"bloom" | "sine"`), `speed` — no other fields, no rename support (delete + re-save instead).
- Preset speed is always sourced from the existing "Visual speed" setting (range `0.01`–`2`), never the live mouse-driven sine speed.
- Active style/speed stay in `localStorage` (`mindful:voice-settings`) exactly as `visualSpeed` does today; presets live in Postgres. Applying a preset copies values one-way from DB into `localStorage` — they are not kept in sync afterward.
- No new API routes — Server Actions only, called directly from client components.
- No component-test infrastructure exists in this repo; only pure functions get automated (Vitest) tests. Anything involving the DOM, Canvas, or a real DB connection is verified manually against the dev server (`npm run dev`, port 3333 per `CLAUDE.md`).
- `prefers-reduced-motion` does not disable the wave's scrolling — motion is the content, matching the existing precedent for the dot's growth.

---

### Task 1: Add the `visualization_presets` table

**Files:**
- Modify: `src/db/schema.ts`

**Interfaces:**
- Produces: `visualizationPresets` Drizzle table (columns: `id uuid PK`, `userId text`, `name text`, `style text`, `speed real`, `createdAt timestamp`), used by Task 3.

- [ ] **Step 1: Add the `real` import**

In `src/db/schema.ts`, the import block currently reads:

```ts
import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  date,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
```

Change it to add `real`:

```ts
import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  date,
  boolean,
  pgEnum,
  real,
} from "drizzle-orm/pg-core";
```

- [ ] **Step 2: Append the new table**

At the end of `src/db/schema.ts`, after the `feelingEntries` table definition, add:

```ts
export const visualizationPresets = pgTable("visualization_presets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .references(() => users.clerkId)
    .notNull(),
  name: text("name").notNull(),
  style: text("style").notNull(),
  speed: real("speed").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

- [ ] **Step 3: Push the schema change**

This repo has no `drizzle/` migrations folder — schema changes are applied directly with `db:push` (confirmed: no prior migration files exist in git history). Run:

```bash
npm run db:push
```

When prompted, confirm creating the new table (it's a pure addition, no data loss possible).

- [ ] **Step 4: Verify the table exists**

```bash
npm run db:studio
```

Open the printed local URL, confirm `visualization_presets` appears in the table list with columns `id, user_id, name, style, speed, created_at`. Close the studio process (Ctrl+C).

- [ ] **Step 5: Commit**

```bash
git add src/db/schema.ts
git commit -m "feat: add visualization_presets table"
```

---

### Task 2: Preset validators and types

**Files:**
- Create: `src/lib/visualization-presets.ts`
- Test: `src/lib/visualization-presets.test.ts`

**Interfaces:**
- Produces: `VISUALIZATION_STYLES`, `VisualizationStyle` type, `VisualizationPresetSummary` type, `MIN_PRESET_SPEED`, `MAX_PRESET_SPEED`, `isValidVisualizationStyle(style: unknown): style is VisualizationStyle`, `isValidPresetName(name: unknown): name is string`, `isValidPresetSpeed(speed: unknown): speed is number` — all consumed by Task 3.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/visualization-presets.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  VISUALIZATION_STYLES,
  isValidVisualizationStyle,
  isValidPresetName,
  isValidPresetSpeed,
} from "./visualization-presets";

describe("VISUALIZATION_STYLES", () => {
  it("has exactly bloom and sine", () => {
    expect(VISUALIZATION_STYLES).toEqual(["bloom", "sine"]);
  });
});

describe("isValidVisualizationStyle", () => {
  it("accepts bloom", () => {
    expect(isValidVisualizationStyle("bloom")).toBe(true);
  });

  it("accepts sine", () => {
    expect(isValidVisualizationStyle("sine")).toBe(true);
  });

  it("rejects an unknown style", () => {
    expect(isValidVisualizationStyle("linear")).toBe(false);
  });

  it("rejects non-string values", () => {
    expect(isValidVisualizationStyle(123)).toBe(false);
    expect(isValidVisualizationStyle(undefined)).toBe(false);
    expect(isValidVisualizationStyle(null)).toBe(false);
  });
});

describe("isValidPresetName", () => {
  it("accepts a normal name", () => {
    expect(isValidPresetName("Deep focus")).toBe(true);
  });

  it("rejects an empty string", () => {
    expect(isValidPresetName("")).toBe(false);
  });

  it("rejects a whitespace-only string", () => {
    expect(isValidPresetName("   ")).toBe(false);
  });

  it("rejects non-string values", () => {
    expect(isValidPresetName(123)).toBe(false);
    expect(isValidPresetName(undefined)).toBe(false);
  });
});

describe("isValidPresetSpeed", () => {
  it("accepts values inside the slider range", () => {
    expect(isValidPresetSpeed(1)).toBe(true);
  });

  it("accepts the boundaries", () => {
    expect(isValidPresetSpeed(0.01)).toBe(true);
    expect(isValidPresetSpeed(2)).toBe(true);
  });

  it("rejects values below the minimum", () => {
    expect(isValidPresetSpeed(0)).toBe(false);
  });

  it("rejects values above the maximum", () => {
    expect(isValidPresetSpeed(2.5)).toBe(false);
  });

  it("rejects NaN and Infinity", () => {
    expect(isValidPresetSpeed(NaN)).toBe(false);
    expect(isValidPresetSpeed(Infinity)).toBe(false);
  });

  it("rejects non-number values", () => {
    expect(isValidPresetSpeed("1")).toBe(false);
  });
});
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `npx vitest run src/lib/visualization-presets.test.ts`
Expected: FAIL — `visualization-presets.ts` does not exist yet.

- [ ] **Step 3: Implement**

Create `src/lib/visualization-presets.ts`:

```ts
export const VISUALIZATION_STYLES = ["bloom", "sine"] as const;
export type VisualizationStyle = (typeof VISUALIZATION_STYLES)[number];

export const MIN_PRESET_SPEED = 0.01;
export const MAX_PRESET_SPEED = 2;

export interface VisualizationPresetSummary {
  id: string;
  name: string;
  style: VisualizationStyle;
  speed: number;
  createdAt: string;
}

export function isValidVisualizationStyle(
  style: unknown
): style is VisualizationStyle {
  return (
    typeof style === "string" &&
    (VISUALIZATION_STYLES as readonly string[]).includes(style)
  );
}

export function isValidPresetName(name: unknown): name is string {
  return typeof name === "string" && name.trim().length > 0;
}

export function isValidPresetSpeed(speed: unknown): speed is number {
  return (
    typeof speed === "number" &&
    Number.isFinite(speed) &&
    speed >= MIN_PRESET_SPEED &&
    speed <= MAX_PRESET_SPEED
  );
}
```

- [ ] **Step 4: Run the tests and verify they pass**

Run: `npx vitest run src/lib/visualization-presets.test.ts`
Expected: PASS, all 15 tests green.

- [ ] **Step 5: Type-check and lint**

```bash
npx tsc --noEmit -p tsconfig.json
npx eslint src/lib/visualization-presets.ts src/lib/visualization-presets.test.ts
```

Expected: no errors from either command.

- [ ] **Step 6: Commit**

```bash
git add src/lib/visualization-presets.ts src/lib/visualization-presets.test.ts
git commit -m "feat: add visualization preset validators and types"
```

---

### Task 3: Server actions for preset CRUD

**Files:**
- Create: `src/app/(app)/meditate/visualization-actions.ts`

**Interfaces:**
- Consumes: `visualizationPresets` table (Task 1); `VisualizationStyle`, `VisualizationPresetSummary`, `isValidPresetName`, `isValidVisualizationStyle`, `isValidPresetSpeed` (Task 2).
- Produces: `listVisualizationPresets(): Promise<VisualizationPresetSummary[]>`, `saveVisualizationPreset(name: string, style: VisualizationStyle, speed: number): Promise<VisualizationPresetSummary>`, `deleteVisualizationPreset(id: string): Promise<void>` — consumed by Task 8's settings panel.

- [ ] **Step 1: Implement**

Create `src/app/(app)/meditate/visualization-actions.ts`:

```ts
"use server";

import { auth } from "@clerk/nextjs/server";
import { and, desc, eq } from "drizzle-orm";
import { getDb } from "@/db";
import { visualizationPresets } from "@/db/schema";
import {
  isValidPresetName,
  isValidPresetSpeed,
  isValidVisualizationStyle,
  type VisualizationPresetSummary,
  type VisualizationStyle,
} from "@/lib/visualization-presets";

function toSummary(
  row: typeof visualizationPresets.$inferSelect
): VisualizationPresetSummary {
  return {
    id: row.id,
    name: row.name,
    style: row.style as VisualizationStyle,
    speed: row.speed,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listVisualizationPresets(): Promise<
  VisualizationPresetSummary[]
> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const db = getDb();
  const rows = await db.query.visualizationPresets.findMany({
    where: eq(visualizationPresets.userId, userId),
    orderBy: [desc(visualizationPresets.createdAt)],
  });

  return rows.map(toSummary);
}

export async function saveVisualizationPreset(
  name: string,
  style: VisualizationStyle,
  speed: number
): Promise<VisualizationPresetSummary> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const trimmed = typeof name === "string" ? name.trim() : "";
  if (!isValidPresetName(trimmed)) throw new Error("Preset name is required");
  if (!isValidVisualizationStyle(style)) {
    throw new Error("Invalid visualization style");
  }
  if (!isValidPresetSpeed(speed)) throw new Error("Invalid visualization speed");

  const db = getDb();
  const [row] = await db
    .insert(visualizationPresets)
    .values({ userId, name: trimmed, style, speed })
    .returning();

  return toSummary(row);
}

export async function deleteVisualizationPreset(id: string): Promise<void> {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const db = getDb();
  await db
    .delete(visualizationPresets)
    .where(
      and(
        eq(visualizationPresets.id, id),
        eq(visualizationPresets.userId, userId)
      )
    );
}
```

- [ ] **Step 2: Type-check and lint**

```bash
npx tsc --noEmit -p tsconfig.json
npx eslint "src/app/(app)/meditate/visualization-actions.ts"
```

Expected: no errors.

- [ ] **Step 3: Manual smoke test**

This needs a real signed-in session, so it's verified in Task 8 once there's UI to call these actions from. For now, confirm the file compiles and exports the three functions (covered by Step 2).

- [ ] **Step 4: Commit**

```bash
git add "src/app/(app)/meditate/visualization-actions.ts"
git commit -m "feat: add visualization preset server actions"
```

---

### Task 4: Extract `DotVisual` from the current overlay

**Files:**
- Create: `src/components/dot-visual.tsx`

**Interfaces:**
- Produces: `DotVisual({ paused: boolean; speed: number })` — a self-contained, absolutely-positioned dual-layer crossfading dot animation. Consumed by Task 7.

This is a verbatim extraction of the animation logic already in `src/components/breathing-dot-overlay.tsx` (lines 1–15, 41–111, 133–154) — no behavior change, just moved into its own component so `visual-overlay.tsx` (Task 7) can pick between this and `SineWaveVisual` (Task 6). `breathing-dot-overlay.tsx` itself is left untouched here and deleted in Task 7 once nothing needs it.

- [ ] **Step 1: Implement**

Create `src/components/dot-visual.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";

const BASE_DURATION_MS = 7200;
const MIN_DIAMETER_FRACTION = 0.015;
const MIN_DIAMETER_PX = 3;
const MAX_DIAMETER_MULTIPLE = 2.6;
const DOT_GRADIENT =
  "radial-gradient(circle at 50% 50%, var(--muted-foreground) 0%, var(--muted-foreground) 55%, transparent 78%)";

function ease(t: number) {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

// Each layer is fully invisible for the second half of its own cycle (it's
// still growing back there, just unseen) so its phase partner's small,
// just-emerging dot is never masked by an already-large overlapping one —
// every repeat reads as coming from far away, not just the first.
function fadeEnvelope(t: number, inEnd = 0.06, outStart = 0.32, outEnd = 0.5) {
  if (t < inEnd) return t / inEnd;
  if (t < outStart) return 1;
  if (t < outEnd) return Math.max(0, 1 - (t - outStart) / (outEnd - outStart));
  return 0;
}

interface DotVisualProps {
  paused: boolean;
  speed: number;
}

export function DotVisual({ paused, speed }: DotVisualProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const layerARef = useRef<HTMLDivElement>(null);
  const layerBRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef(0);
  const pausedAtRef = useRef(0);
  const pausedRef = useRef(paused);
  const speedRef = useRef(speed);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    if (paused) {
      pausedAtRef.current = performance.now();
    } else if (pausedAtRef.current) {
      startTimeRef.current += performance.now() - pausedAtRef.current;
      pausedAtRef.current = 0;
    }
  }, [paused]);

  useEffect(() => {
    const container = containerRef.current;
    const layers = [layerARef.current, layerBRef.current];
    if (!container || !layers[0] || !layers[1]) return;

    startTimeRef.current = performance.now();

    function tick() {
      if (!pausedRef.current) {
        const duration = BASE_DURATION_MS / speedRef.current;
        const elapsed = performance.now() - startTimeRef.current;
        const w = container!.clientWidth;
        const h = container!.clientHeight;
        const base = Math.max(
          MIN_DIAMETER_PX,
          Math.min(w, h) * MIN_DIAMETER_FRACTION
        );
        const max = Math.sqrt(w * w + h * h) * MAX_DIAMETER_MULTIPLE;

        [0, 0.5].forEach((phase, i) => {
          const localElapsed = elapsed - phase * duration;
          const el = layers[i]!;
          if (localElapsed < 0) {
            el.style.width = `${base}px`;
            el.style.height = `${base}px`;
            el.style.opacity = "0";
            return;
          }
          const t = (localElapsed / duration) % 1;
          const diameter = base + (max - base) * ease(t);
          el.style.width = `${diameter}px`;
          el.style.height = `${diameter}px`;
          el.style.opacity = String(fadeEnvelope(t));
        });
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden">
      <div
        ref={layerARef}
        className="absolute rounded-full opacity-0"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: DOT_GRADIENT,
        }}
      />
      <div
        ref={layerBRef}
        className="absolute rounded-full opacity-0"
        style={{
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          background: DOT_GRADIENT,
        }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Type-check and lint**

```bash
npx tsc --noEmit -p tsconfig.json
npx eslint src/components/dot-visual.tsx
```

Expected: no errors.

- [ ] **Step 3: Manual smoke test via a throwaway preview route**

Create a temporary route to render it in isolation (this route is deleted at the end of this step — it never gets committed):

```bash
mkdir -p src/app/dev-preview-visual
```

Create `src/app/dev-preview-visual/page.tsx`:

```tsx
"use client";

import { DotVisual } from "@/components/dot-visual";

export default function DevPreviewPage() {
  return (
    <div className="fixed inset-0 bg-background">
      <DotVisual paused={false} speed={1} />
    </div>
  );
}
```

Start the dev server if it isn't running (`npm run dev`, http://localhost:3333), open http://localhost:3333/dev-preview-visual, and confirm the dot grows from a small point, crossfades, and repeats — identical to how it behaves in the live app today. Then delete the throwaway route:

```bash
rm -rf src/app/dev-preview-visual
```

- [ ] **Step 4: Commit**

```bash
git add src/components/dot-visual.tsx
git commit -m "feat: extract DotVisual from the breathing dot overlay"
```

---

### Task 5: Sine wave motion math

**Files:**
- Create: `src/lib/sine-wave-motion.ts`
- Test: `src/lib/sine-wave-motion.test.ts`

**Interfaces:**
- Produces: `MIN_SPEED = 0.1`, `MAX_SPEED = 3`, `LERP_FACTOR = 0.06`, `lerp(current: number, target: number, factor: number): number`, `targetSpeedFromMouseX(mouseX: number, width: number, minSpeed?: number, maxSpeed?: number): number` — consumed by Task 6.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/sine-wave-motion.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { lerp, targetSpeedFromMouseX, MIN_SPEED, MAX_SPEED } from "./sine-wave-motion";

describe("lerp", () => {
  it("moves halfway to the target at factor 0.5", () => {
    expect(lerp(0, 10, 0.5)).toBe(5);
  });

  it("returns current unchanged at factor 0", () => {
    expect(lerp(3, 10, 0)).toBe(3);
  });

  it("returns target exactly at factor 1", () => {
    expect(lerp(3, 10, 1)).toBe(10);
  });

  it("returns the same value when current equals target", () => {
    expect(lerp(7, 7, 0.5)).toBe(7);
  });
});

describe("targetSpeedFromMouseX", () => {
  it("returns MIN_SPEED at the left edge", () => {
    expect(targetSpeedFromMouseX(0, 1000)).toBe(MIN_SPEED);
  });

  it("returns MAX_SPEED at the right edge", () => {
    expect(targetSpeedFromMouseX(1000, 1000)).toBe(MAX_SPEED);
  });

  it("returns the midpoint at the horizontal center", () => {
    expect(targetSpeedFromMouseX(500, 1000)).toBeCloseTo(
      (MIN_SPEED + MAX_SPEED) / 2
    );
  });

  it("clamps values left of the visible area", () => {
    expect(targetSpeedFromMouseX(-50, 1000)).toBe(MIN_SPEED);
  });

  it("clamps values right of the visible area", () => {
    expect(targetSpeedFromMouseX(1200, 1000)).toBe(MAX_SPEED);
  });

  it("guards against a zero-width container", () => {
    expect(targetSpeedFromMouseX(50, 0)).toBe(MIN_SPEED);
  });

  it("respects custom min/max bounds", () => {
    expect(targetSpeedFromMouseX(0, 100, 1, 5)).toBe(1);
    expect(targetSpeedFromMouseX(100, 100, 1, 5)).toBe(5);
  });
});
```

- [ ] **Step 2: Run the tests and verify they fail**

Run: `npx vitest run src/lib/sine-wave-motion.test.ts`
Expected: FAIL — `sine-wave-motion.ts` does not exist yet.

- [ ] **Step 3: Implement**

Create `src/lib/sine-wave-motion.ts`:

```ts
export const MIN_SPEED = 0.1;
export const MAX_SPEED = 3;
export const LERP_FACTOR = 0.06;

export function lerp(current: number, target: number, factor: number): number {
  return current + (target - current) * factor;
}

export function targetSpeedFromMouseX(
  mouseX: number,
  width: number,
  minSpeed: number = MIN_SPEED,
  maxSpeed: number = MAX_SPEED
): number {
  if (width <= 0) return minSpeed;
  const frac = Math.min(1, Math.max(0, mouseX / width));
  return minSpeed + frac * (maxSpeed - minSpeed);
}
```

- [ ] **Step 4: Run the tests and verify they pass**

Run: `npx vitest run src/lib/sine-wave-motion.test.ts`
Expected: PASS, all 11 tests green.

- [ ] **Step 5: Type-check and lint**

```bash
npx tsc --noEmit -p tsconfig.json
npx eslint src/lib/sine-wave-motion.ts src/lib/sine-wave-motion.test.ts
```

Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add src/lib/sine-wave-motion.ts src/lib/sine-wave-motion.test.ts
git commit -m "feat: add sine wave speed/lerp math"
```

---

### Task 6: `SineWaveVisual` component

**Files:**
- Create: `src/components/sine-wave-visual.tsx`

**Interfaces:**
- Consumes: `lerp`, `targetSpeedFromMouseX`, `MIN_SPEED`, `MAX_SPEED`, `LERP_FACTOR` (Task 5).
- Produces: `SineWaveVisual({ paused: boolean; speed: number })` — a self-contained, absolutely-positioned Canvas wave. Consumed by Task 7. Same prop shape as `DotVisual` (Task 4) so `visual-overlay.tsx` can swap between them with an identical call site.

- [ ] **Step 1: Implement**

Create `src/components/sine-wave-visual.tsx`:

```tsx
"use client";

import { useEffect, useRef } from "react";
import { lerp, targetSpeedFromMouseX, LERP_FACTOR } from "@/lib/sine-wave-motion";

const WAVE_COUNT = 3; // how many full crests are visible across the width
const AMPLITUDE_FRACTION = 0.12; // of viewport height
const BASE_CYCLES_PER_SECOND = 0.15; // scroll rate at speed = 1
const FALLBACK_STROKE_COLOR = "oklch(0.5 0.02 250)";

interface SineWaveVisualProps {
  paused: boolean;
  speed: number;
}

export function SineWaveVisual({ paused, speed }: SineWaveVisualProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number | null>(null);
  const lastFrameRef = useRef(0);
  const phaseRef = useRef(0);
  const currentSpeedRef = useRef(speed);
  const mouseInsideRef = useRef(false);
  const mouseXRef = useRef(0);
  const pausedRef = useRef(paused);
  const speedRef = useRef(speed);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
    }
    resize();
    window.addEventListener("resize", resize);

    function handleMouseMove(e: MouseEvent) {
      mouseInsideRef.current = true;
      mouseXRef.current = e.clientX;
    }
    function handleMouseLeave() {
      mouseInsideRef.current = false;
    }
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    lastFrameRef.current = performance.now();

    function tick(now: number) {
      const elapsedMs = now - lastFrameRef.current;
      lastFrameRef.current = now;

      const width = canvas!.width;
      const height = canvas!.height;

      if (!pausedRef.current && width > 0) {
        const target = mouseInsideRef.current
          ? targetSpeedFromMouseX(mouseXRef.current, width)
          : speedRef.current;
        currentSpeedRef.current = lerp(
          currentSpeedRef.current,
          target,
          LERP_FACTOR
        );
        phaseRef.current +=
          (elapsedMs / 1000) *
          currentSpeedRef.current *
          BASE_CYCLES_PER_SECOND *
          Math.PI *
          2;
      }

      ctx!.clearRect(0, 0, width, height);

      if (width > 0) {
        const amplitude = height * AMPLITUDE_FRACTION;
        const centerY = height / 2;
        const frequency = (2 * Math.PI * WAVE_COUNT) / width;
        const strokeColor =
          getComputedStyle(document.documentElement)
            .getPropertyValue("--muted-foreground")
            .trim() || FALLBACK_STROKE_COLOR;

        ctx!.beginPath();
        ctx!.lineWidth = 2;
        ctx!.strokeStyle = strokeColor;
        for (let x = 0; x <= width; x += 4) {
          const y = centerY + amplitude * Math.sin(x * frequency + phaseRef.current);
          if (x === 0) ctx!.moveTo(x, y);
          else ctx!.lineTo(x, y);
        }
        ctx!.stroke();
      }

      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0" />;
}
```

- [ ] **Step 2: Type-check and lint**

```bash
npx tsc --noEmit -p tsconfig.json
npx eslint src/components/sine-wave-visual.tsx
```

Expected: no errors.

- [ ] **Step 3: Manual smoke test via a throwaway preview route**

```bash
mkdir -p src/app/dev-preview-visual
```

Create `src/app/dev-preview-visual/page.tsx`:

```tsx
"use client";

import { SineWaveVisual } from "@/components/sine-wave-visual";

export default function DevPreviewPage() {
  return (
    <div className="fixed inset-0 bg-background">
      <SineWaveVisual paused={false} speed={1} />
    </div>
  );
}
```

Open http://localhost:3333/dev-preview-visual and confirm:
- A horizontal wave line is visible, centered vertically, continuously scrolling.
- Moving the mouse to the left slows the scroll; moving it to the right speeds it up; the transition eases rather than snapping.
- Moving the mouse off the page lets the speed ease back down to the baseline (`speed=1` here).
- Resizing the browser window doesn't stretch or break the line.

Then delete the throwaway route:

```bash
rm -rf src/app/dev-preview-visual
```

- [ ] **Step 4: Commit**

```bash
git add src/components/sine-wave-visual.tsx
git commit -m "feat: add mouse-reactive sine wave visual"
```

---

### Task 7: `VisualOverlay` shell, style dispatch, and player wiring

**Files:**
- Create: `src/components/visual-overlay.tsx`
- Delete: `src/components/breathing-dot-overlay.tsx`
- Modify: `src/lib/voice-settings.ts`
- Modify: `src/components/meditation-player.tsx`

**Interfaces:**
- Consumes: `DotVisual` (Task 4), `SineWaveVisual` (Task 6).
- Produces: `VisualOverlay({ style: "bloom" | "sine"; paused; onTogglePause; onExit; speed })`; `VoiceSettings.visualStyle: "bloom" | "sine"` field — consumed by Task 8's settings panel.

- [ ] **Step 1: Add `visualStyle` to voice settings**

In `src/lib/voice-settings.ts`, the type currently ends:

```ts
export type VoiceSettings = {
  rate: number;
  pitch: number;
  volume: number;
  voiceURI: string | null;
  lang: string;
  preferredEngine: "audio" | "tts";
  visualSpeed: number;
};

export const DEFAULT_VOICE_SETTINGS: Readonly<VoiceSettings> = Object.freeze({
  rate: 0.9,
  pitch: 0.95,
  volume: 1,
  voiceURI: null,
  lang: "en-US",
  preferredEngine: "audio",
  visualSpeed: 1,
});
```

Change both to add `visualStyle`:

```ts
export type VoiceSettings = {
  rate: number;
  pitch: number;
  volume: number;
  voiceURI: string | null;
  lang: string;
  preferredEngine: "audio" | "tts";
  visualSpeed: number;
  visualStyle: "bloom" | "sine";
};

export const DEFAULT_VOICE_SETTINGS: Readonly<VoiceSettings> = Object.freeze({
  rate: 0.9,
  pitch: 0.95,
  volume: 1,
  voiceURI: null,
  lang: "en-US",
  preferredEngine: "audio",
  visualSpeed: 1,
  visualStyle: "bloom",
});
```

No other change is needed in this file — `readStorage()` already spreads `DEFAULT_VOICE_SETTINGS` before the parsed value, so existing users without a stored `visualStyle` get `"bloom"` (today's only style) by default.

- [ ] **Step 2: Create the overlay shell**

Create `src/components/visual-overlay.tsx`:

```tsx
"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { DotVisual } from "@/components/dot-visual";
import { SineWaveVisual } from "@/components/sine-wave-visual";

interface VisualOverlayProps {
  style: "bloom" | "sine";
  paused: boolean;
  onTogglePause: () => void;
  onExit: () => void;
  speed: number;
}

export function VisualOverlay({
  style,
  paused,
  onTogglePause,
  onExit,
  speed,
}: VisualOverlayProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onExit();
      else if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        onTogglePause();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onExit, onTogglePause]);

  return (
    <div
      className="fixed inset-0 z-50 cursor-pointer bg-background"
      onClick={onTogglePause}
      role="button"
      tabIndex={-1}
      aria-label={paused ? "Resume session" : "Pause session"}
    >
      {style === "bloom" ? (
        <DotVisual paused={paused} speed={speed} />
      ) : (
        <SineWaveVisual paused={paused} speed={speed} />
      )}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onExit();
        }}
        aria-label="Exit full-screen visual"
        className="absolute right-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/80 text-muted-foreground backdrop-blur transition-colors hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>

      {paused && (
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2 text-muted-foreground">
          <div className="flex h-12 w-12 items-center justify-center gap-1 rounded-full border border-border bg-card/80 backdrop-blur">
            <span className="h-4 w-1.5 rounded-full bg-foreground" />
            <span className="h-4 w-1.5 rounded-full bg-foreground" />
          </div>
          <span className="rounded-full border border-border bg-card/80 px-3 py-1 text-xs text-foreground backdrop-blur">
            Paused — tap to resume
          </span>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: Delete the old overlay**

```bash
rm src/components/breathing-dot-overlay.tsx
```

- [ ] **Step 4: Update `meditation-player.tsx`**

In `src/components/meditation-player.tsx`, change the import (currently line 8):

```ts
import { BreathingDotOverlay } from "@/components/breathing-dot-overlay";
```

to:

```ts
import { VisualOverlay } from "@/components/visual-overlay";
```

And change the render call (currently lines 348–355):

```tsx
      {showVisual && (
        <BreathingDotOverlay
          paused={!isPlaying}
          onTogglePause={togglePlay}
          onExit={() => setShowVisual(false)}
          speed={settings.visualSpeed}
        />
      )}
```

to:

```tsx
      {showVisual && (
        <VisualOverlay
          style={settings.visualStyle}
          paused={!isPlaying}
          onTogglePause={togglePlay}
          onExit={() => setShowVisual(false)}
          speed={settings.visualSpeed}
        />
      )}
```

- [ ] **Step 5: Type-check and lint**

```bash
npx tsc --noEmit -p tsconfig.json
npx eslint src/lib/voice-settings.ts src/components/visual-overlay.tsx src/components/meditation-player.tsx
```

Expected: no errors. Confirm `src/components/breathing-dot-overlay.tsx` no longer exists and nothing else imports it:

```bash
grep -rn "breathing-dot-overlay" src
```

Expected: no output.

- [ ] **Step 6: Manual smoke test — both styles, wired into the real player**

Sign in at http://localhost:3333/sign-in with a real account, open any meditation at `/meditate/[id]`, click **Visual**. Confirm it looks and behaves exactly as before (Soft Bloom, click to pause, ✕ to exit) — this is the default `visualStyle`.

Then, with the player open, open browser devtools → Application/Storage → Local Storage → `http://localhost:3333` → edit the `mindful:voice-settings` key, changing `"visualStyle":"bloom"` to `"visualStyle":"sine"`. Reload the page, click **Visual** again, and confirm the sine wave now renders instead, with mouse-driven speed working, pause/resume working, and exit working. Set it back to `"bloom"` (or clear the key) when done, since there's no UI to change it yet — that's Task 8.

- [ ] **Step 7: Commit**

```bash
git add src/components/visual-overlay.tsx src/components/meditation-player.tsx src/lib/voice-settings.ts src/components/breathing-dot-overlay.tsx
git commit -m "feat: split visual overlay into a style-dispatching shell"
```

`git add` on the already-deleted `breathing-dot-overlay.tsx` path stages the deletion — `git status` before committing should show it as `deleted:`, alongside the new/modified files.

---

### Task 8: Settings panel — style picker and saved visualizations

**Files:**
- Modify: `src/components/voice-settings-panel.tsx`

**Interfaces:**
- Consumes: `listVisualizationPresets`, `saveVisualizationPreset`, `deleteVisualizationPreset` (Task 3); `VisualizationPresetSummary` (Task 2); `settings.visualStyle`, `onChange` (existing prop, Task 7).

- [ ] **Step 1: Add imports and local state**

In `src/components/voice-settings-panel.tsx`, change the import block (currently lines 1–6):

```tsx
"use client";

import { useEffect, useId, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VoiceSettings } from "@/lib/voice-settings";
```

to:

```tsx
"use client";

import { useEffect, useId, useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { VoiceSettings } from "@/lib/voice-settings";
import type { VisualizationPresetSummary } from "@/lib/visualization-presets";
import {
  listVisualizationPresets,
  saveVisualizationPreset,
  deleteVisualizationPreset,
} from "@/app/(app)/meditate/visualization-actions";
```

Inside the component, after the existing `const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);` line (currently line 27), add:

```tsx
  const [presets, setPresets] = useState<VisualizationPresetSummary[]>([]);
  const [newPresetName, setNewPresetName] = useState("");
  const [presetError, setPresetError] = useState<string | null>(null);
```

Right after the existing "Load browser TTS voices" `useEffect` (currently lines 33–45), add a new effect to load presets on mount:

```tsx
  // Load saved visualization presets once on mount.
  useEffect(() => {
    listVisualizationPresets()
      .then(setPresets)
      .catch(() => setPresetError("Couldn't load saved visualizations"));
  }, []);
```

- [ ] **Step 2: Add handlers**

Still inside the component, after the `effectiveVoiceURI` computation (currently line 58), add:

```tsx
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
```

- [ ] **Step 3: Add the style picker**

In the JSX, right after the "Visual speed" `<Field>` block (currently lines 164–175) and before the "Preferred engine" `<Field>` (currently starting at line 177), add:

```tsx
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
```

- [ ] **Step 4: Add the saved visualizations section**

Directly after the "Preferred engine" `<Field>` block closes (currently right before the final `</div>` that closes the component's root `<div className="space-y-5 ...">`, i.e. right before what is currently line 200), add:

```tsx
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
```

- [ ] **Step 5: Type-check and lint**

```bash
npx tsc --noEmit -p tsconfig.json
npx eslint src/components/voice-settings-panel.tsx
```

Expected: no errors.

- [ ] **Step 6: Full manual end-to-end verification**

With `npm run dev` running, signed in at http://localhost:3333/sign-in, open a meditation session at `/meditate/[id]`:

1. Open settings (gear/Voice button). Confirm "Visual style" shows Soft Bloom selected, "Saved visualizations" shows an empty list (or existing presets from earlier manual testing) with no error message.
2. Switch style to Sine Wave, click **Visual** — confirm the wave renders and responds to mouse X position.
3. Move the mouse off the visual — confirm speed eases back to the baseline (the Visual speed slider's value).
4. Click to pause, click to resume, press Escape to exit, reopen and press ✕ to exit — confirm all four work for the sine wave.
5. Switch back to Soft Bloom, open the visual, confirm it's unchanged from before this feature.
6. In settings, type a name (e.g. "Test preset"), click Save — confirm it appears in the list immediately with the correct style/speed.
7. Change the style/speed to something else, then click **Use** on the saved preset — confirm the style radio and speed slider both jump back to the preset's values.
8. Reload the entire page (full browser refresh, not client navigation) and reopen settings — confirm the preset is still listed (this proves it round-tripped through Postgres, not just component state).
9. Click the trash icon on the preset — confirm it disappears from the list; reload again and confirm it's still gone.
10. Toggle the OS/browser dark mode and repeat steps 2–3 — confirm the wave's stroke color adapts (it reads `--muted-foreground` live).

- [ ] **Step 7: Commit**

```bash
git add src/components/voice-settings-panel.tsx
git commit -m "feat: add visual style picker and saved visualizations UI"
```

---

## Self-Review Notes

- **Spec coverage:** every section of the spec maps to a task — data model → Task 1, server actions → Task 3, sine wave rendering/mouse control → Tasks 5–6, component split → Tasks 4/6/7, settings UI → Task 8, `visualStyle` field → Task 7. Edge cases (empty name, deleting an applied preset, mouse leaving, touch devices, resize, reduced motion) are covered by the validators (Task 2), the lerp/fallback design (Tasks 5–6), and the manual test scripts (Tasks 6 and 8).
- **Placeholder scan:** no TBDs; every step has complete, pasteable code or a fully written manual test script.
- **Type consistency:** `DotVisual` and `SineWaveVisual` share the identical `{ paused: boolean; speed: number }` prop shape (Tasks 4 and 6) so `VisualOverlay` (Task 7) can call either interchangeably. `VisualizationPresetSummary` (Task 2) is the one shape used end-to-end — server actions (Task 3) return it, the settings panel (Task 8) consumes it — no separate DB-row type leaks past `visualization-actions.ts`.
