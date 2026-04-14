# Pre-recorded Voice Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an allow-listed admin upload a human recording for a meditation and have the player prefer it over the TTS audio, with a one-click remove that falls back to TTS.

**Architecture:** Add a nullable `recordedAudioUrl` column to `meditations`. Gate an upload/remove API route on an `ADMIN_USER_IDS` env var via a new `isAdmin()` helper. Render an admin-only client component beneath the player that POSTs / DELETEs to the route and calls `router.refresh()` afterwards. The server component resolves `audioSrc = recordedAudioUrl ?? audioUrl` before passing it down, so the player has no knowledge of the fallback logic.

**Tech Stack:** Next.js 16 App Router, Drizzle ORM, Postgres (Neon), Clerk, Vercel Blob (`@vercel/blob`), Tailwind + shadcn/ui.

**Deviation from spec:** The spec called for unit tests (`isAdmin`, API route). The repo has **no test framework installed** (no Vitest, no Jest, no test scripts in `package.json`). Introducing one is scope creep for this feature. The plan skips automated tests and uses thorough manual verification instead. If the reviewer wants automated tests added, that becomes a follow-up task.

---

## File structure

**New files:**
- `src/lib/admin.ts` — `isAdmin(userId)` helper reading `ADMIN_USER_IDS`.
- `src/app/api/admin/meditations/[id]/recording/route.ts` — POST upload / DELETE remove.
- `src/components/admin-recording-controls.tsx` — admin-only client UI.

**Modified files:**
- `src/db/schema.ts` — add `recordedAudioUrl` column to `meditations`.
- `src/app/(app)/meditate/[id]/page.tsx` — resolve `audioSrc`, compute `isAdmin`, pass both plus `hasRecording` to `MeditateClient`.
- `src/app/(app)/meditate/[id]/client.tsx` — accept new props, render `<AdminRecordingControls>` during the `playing` phase.
- `.env.local` — add `ADMIN_USER_IDS` entry.

No existing file is being refactored. Each new file is under ~120 lines with a single responsibility.

---

## Task 1: Add `recordedAudioUrl` column to schema

**Files:**
- Modify: `src/db/schema.ts:44-55`

- [ ] **Step 1: Edit the schema**

Change the `meditations` table definition to add `recordedAudioUrl` right after `audioUrl`:

```ts
export const meditations = pgTable("meditations", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: categoryEnum("category").notNull(),
  durationSeconds: integer("duration_seconds").notNull(),
  difficulty: difficultyEnum("difficulty").notNull(),
  script: text("script").notNull(),
  audioUrl: text("audio_url"),
  recordedAudioUrl: text("recorded_audio_url"),
  voice: text("voice").default("shimmer"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
```

- [ ] **Step 2: Push the schema to the database**

Run: `npm run db:push`

Expected: drizzle-kit prints a diff that adds `recorded_audio_url text` to `meditations` and confirms with no data loss. Answer `Yes` at the prompt if one appears.

- [ ] **Step 3: Verify the column exists**

Run: `npm run db:studio` (or open your preferred DB client against `DATABASE_URL`) and check that `meditations.recorded_audio_url` is present and nullable. Close Studio when done.

- [ ] **Step 4: Commit**

```bash
git add src/db/schema.ts
git commit -m "feat: add recordedAudioUrl column to meditations"
```

---

## Task 2: Admin gate helper

**Files:**
- Create: `src/lib/admin.ts`

- [ ] **Step 1: Create `src/lib/admin.ts`**

```ts
export function isAdmin(userId: string | null | undefined): boolean {
  if (!userId) return false;
  const allow = (process.env.ADMIN_USER_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return allow.includes(userId);
}
```

- [ ] **Step 2: Add your Clerk user ID to `.env.local`**

Find your Clerk user ID in the Clerk dashboard (Users → your user → copy the ID, starts with `user_`). Append to `.env.local`:

```
ADMIN_USER_IDS=user_xxxxxxxxxxxxxxxxxxxxxx
```

Multiple admins: comma-separated, no spaces required (the helper trims).

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors (helper is self-contained).

- [ ] **Step 4: Commit**

```bash
git add src/lib/admin.ts
git commit -m "feat: add isAdmin helper gated on ADMIN_USER_IDS"
```

`.env.local` is gitignored, so it won't be part of the commit — that's intentional.

---

## Task 3: API route — POST (upload)

**Files:**
- Create: `src/app/api/admin/meditations/[id]/recording/route.ts`

- [ ] **Step 1: Create the route file with POST handler only**

```ts
import { auth } from "@clerk/nextjs/server";
import { put, del } from "@vercel/blob";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { meditations } from "@/db/schema";
import { isAdmin } from "@/lib/admin";

const MAX_BYTES = 25 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "audio/mpeg",
  "audio/mp4",
  "audio/x-m4a",
]);

function extFor(mime: string): string {
  if (mime === "audio/mpeg") return "mp3";
  return "m4a";
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!isAdmin(userId)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const db = getDb();
  const meditation = await db.query.meditations.findFirst({
    where: eq(meditations.id, id),
  });
  if (!meditation) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Missing file" }, { status: 400 });
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return Response.json(
      { error: `Unsupported type: ${file.type}` },
      { status: 400 }
    );
  }
  if (file.size > MAX_BYTES) {
    return Response.json(
      { error: `File exceeds 25 MB limit` },
      { status: 400 }
    );
  }

  const ext = extFor(file.type);
  const blob = await put(
    `meditations/${id}-recorded-${Date.now()}.${ext}`,
    file,
    { access: "public", contentType: file.type }
  );

  if (meditation.recordedAudioUrl) {
    try {
      await del(meditation.recordedAudioUrl);
    } catch (err) {
      console.warn("Failed to delete previous recording", err);
    }
  }

  await db
    .update(meditations)
    .set({ recordedAudioUrl: blob.url })
    .where(eq(meditations.id, id));

  return Response.json({ url: blob.url });
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/meditations/\[id\]/recording/route.ts
git commit -m "feat: POST /api/admin/meditations/[id]/recording to upload human voice"
```

---

## Task 4: API route — DELETE (remove)

**Files:**
- Modify: `src/app/api/admin/meditations/[id]/recording/route.ts`

- [ ] **Step 1: Append DELETE handler to the route file**

Add below the `POST` handler:

```ts
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!isAdmin(userId)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const db = getDb();
  const meditation = await db.query.meditations.findFirst({
    where: eq(meditations.id, id),
  });
  if (!meditation) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  if (meditation.recordedAudioUrl) {
    try {
      await del(meditation.recordedAudioUrl);
    } catch (err) {
      console.warn("Failed to delete recording blob", err);
    }
  }

  await db
    .update(meditations)
    .set({ recordedAudioUrl: null })
    .where(eq(meditations.id, id));

  return Response.json({ ok: true });
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/meditations/\[id\]/recording/route.ts
git commit -m "feat: DELETE recording endpoint reverts to TTS fallback"
```

---

## Task 5: Admin recording controls component

**Files:**
- Create: `src/components/admin-recording-controls.tsx`

- [ ] **Step 1: Create the client component**

```tsx
"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const MAX_BYTES = 25 * 1024 * 1024;
const ALLOWED_MIME = new Set([
  "audio/mpeg",
  "audio/mp4",
  "audio/x-m4a",
]);

interface AdminRecordingControlsProps {
  meditationId: string;
  hasRecording: boolean;
}

type Status =
  | { kind: "idle" }
  | { kind: "uploading" }
  | { kind: "removing" }
  | { kind: "error"; message: string };

export function AdminRecordingControls({
  meditationId,
  hasRecording,
}: AdminRecordingControlsProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const busy = status.kind === "uploading" || status.kind === "removing";

  function openPicker() {
    fileInputRef.current?.click();
  }

  async function onFileChosen(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!ALLOWED_MIME.has(file.type)) {
      setStatus({
        kind: "error",
        message: `Unsupported file type: ${file.type || "unknown"}`,
      });
      return;
    }
    if (file.size > MAX_BYTES) {
      setStatus({ kind: "error", message: "File exceeds 25 MB limit" });
      return;
    }

    setStatus({ kind: "uploading" });
    try {
      const body = new FormData();
      body.set("file", file);
      const res = await fetch(
        `/api/admin/meditations/${meditationId}/recording`,
        { method: "POST", body }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Upload failed (${res.status})`);
      }
      setStatus({ kind: "idle" });
      router.refresh();
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "Upload failed",
      });
    }
  }

  async function onRemove() {
    if (!confirm("Remove the uploaded recording and revert to TTS?")) return;
    setStatus({ kind: "removing" });
    try {
      const res = await fetch(
        `/api/admin/meditations/${meditationId}/recording`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `Remove failed (${res.status})`);
      }
      setStatus({ kind: "idle" });
      router.refresh();
    } catch (err) {
      setStatus({
        kind: "error",
        message: err instanceof Error ? err.message : "Remove failed",
      });
    }
  }

  return (
    <div className="mt-4 rounded-md border border-dashed border-muted-foreground/30 p-3 text-sm">
      <div className="mb-2 font-medium text-muted-foreground">
        Admin · Recording
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/mpeg,audio/mp4,audio/x-m4a"
        className="hidden"
        onChange={onFileChosen}
      />
      {hasRecording ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground">
            Using uploaded recording.
          </span>
          <Button size="sm" variant="outline" onClick={openPicker} disabled={busy}>
            Replace
          </Button>
          <Button size="sm" variant="destructive" onClick={onRemove} disabled={busy}>
            Remove
          </Button>
        </div>
      ) : (
        <Button size="sm" variant="outline" onClick={openPicker} disabled={busy}>
          Upload recording
        </Button>
      )}
      {status.kind === "uploading" && (
        <p className="mt-2 text-muted-foreground">Uploading…</p>
      )}
      {status.kind === "removing" && (
        <p className="mt-2 text-muted-foreground">Removing…</p>
      )}
      {status.kind === "error" && (
        <p className="mt-2 text-destructive">{status.message}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/admin-recording-controls.tsx
git commit -m "feat: admin recording controls component"
```

---

## Task 6: Wire controls into the meditation page

**Files:**
- Modify: `src/app/(app)/meditate/[id]/page.tsx`
- Modify: `src/app/(app)/meditate/[id]/client.tsx`

- [ ] **Step 1: Update the server page to resolve audio, check admin, and pass new props**

Replace the file contents of `src/app/(app)/meditate/[id]/page.tsx` with:

```tsx
import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import { getDb } from "@/db";
import { meditations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Badge } from "@/components/ui/badge";
import { MeditateClient } from "./client";
import { isAdmin } from "@/lib/admin";

const CATEGORY_LABELS: Record<string, string> = {
  breath: "Breath Awareness",
  body_scan: "Body Scan",
  stress: "Stress Relief",
  focus: "Focus",
  sleep: "Sleep",
  loving_kindness: "Loving-Kindness",
  morning: "Morning",
};

export default async function MeditatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { id } = await params;
  const db = getDb();
  const meditation = await db.query.meditations.findFirst({
    where: eq(meditations.id, id),
  });

  if (!meditation) notFound();

  const audioSrc = meditation.recordedAudioUrl ?? meditation.audioUrl;
  const admin = isAdmin(userId);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {CATEGORY_LABELS[meditation.category] ?? meditation.category}
          </Badge>
          <Badge variant="outline">
            {Math.round(meditation.durationSeconds / 60)} min
          </Badge>
        </div>
        <h1 className="mt-2 text-2xl font-bold">{meditation.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {meditation.description}
        </p>
      </div>

      <MeditateClient
        meditationId={meditation.id}
        audioUrl={audioSrc}
        script={meditation.script}
        durationSeconds={meditation.durationSeconds}
        admin={admin}
        hasRecording={!!meditation.recordedAudioUrl}
      />
    </div>
  );
}
```

- [ ] **Step 2: Update the client wrapper to render admin controls during the playing phase**

Replace the file contents of `src/app/(app)/meditate/[id]/client.tsx` with:

```tsx
"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { MeditationPlayer } from "@/components/meditation-player";
import { PostSession } from "@/components/post-session";
import { AdminRecordingControls } from "@/components/admin-recording-controls";
import { completeSession, ensureAudio } from "./actions";

interface MeditateClientProps {
  meditationId: string;
  audioUrl: string | null;
  script: string;
  durationSeconds: number;
  admin: boolean;
  hasRecording: boolean;
}

export function MeditateClient({
  meditationId,
  audioUrl,
  script,
  durationSeconds,
  admin,
  hasRecording,
}: MeditateClientProps) {
  const router = useRouter();
  const [phase, setPhase] = useState<"playing" | "reflection">("playing");
  const [resolvedAudioUrl, setResolvedAudioUrl] = useState(audioUrl);

  useEffect(() => {
    if (!audioUrl) {
      ensureAudio(meditationId)
        .then(setResolvedAudioUrl)
        .catch(() => {
          // Will fall back to text display
        });
    }
  }, [audioUrl, meditationId]);

  const handleComplete = useCallback(() => {
    setPhase("reflection");
  }, []);

  async function handleReflectionSubmit(data: {
    moodBefore: number;
    moodAfter: number;
    journalNote: string;
  }) {
    await completeSession(
      meditationId,
      durationSeconds,
      data.moodBefore,
      data.moodAfter,
      data.journalNote
    );
    router.push("/dashboard");
  }

  if (phase === "reflection") {
    return <PostSession onSubmit={handleReflectionSubmit} />;
  }

  return (
    <>
      <MeditationPlayer
        audioUrl={resolvedAudioUrl}
        script={script}
        durationSeconds={durationSeconds}
        onComplete={handleComplete}
      />
      {admin && (
        <AdminRecordingControls
          meditationId={meditationId}
          hasRecording={hasRecording}
        />
      )}
    </>
  );
}
```

Note: the `ensureAudio` effect only fires when `audioUrl` is fully null — it still runs for meditations that have neither a recording nor generated TTS. Because `audioSrc` is now computed server-side, `ensureAudio` won't fire if either source is present. That's correct.

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Start the dev server and visit a meditation page**

Run (in another terminal): `npm run dev`

Visit `http://localhost:3333/meditate/<some-meditation-id>` signed in as the admin user. Expect the admin card labeled "Admin · Recording" to appear below the player with an "Upload recording" button.

Sign in as a non-admin user (incognito window, different Clerk account) and visit the same URL. Expect the admin card to be absent.

- [ ] **Step 5: Commit**

```bash
git add src/app/\(app\)/meditate/\[id\]/page.tsx src/app/\(app\)/meditate/\[id\]/client.tsx
git commit -m "feat: render admin recording controls on meditation page"
```

---

## Task 7: Manual end-to-end smoke test

**Files:** none (verification only)

- [ ] **Step 1: Upload an MP3**

With the dev server still running and signed in as the admin user:

1. Click "Upload recording" on a meditation page.
2. Choose a small MP3 (any short clip ≤ 25 MB).
3. Expect the card to switch to "Using uploaded recording." with Replace / Remove buttons, and the player to reload with the new audio. Press play to confirm it's your uploaded clip, not the original TTS voice.

- [ ] **Step 2: Replace with a second MP3**

1. Click "Replace" and pick a different short MP3.
2. Expect the player to swap to the new clip.
3. Open the Vercel Blob dashboard (`vercel blob ls` or the web UI) and confirm the first uploaded file has been deleted — only the second one should remain under `meditations/<id>-recorded-*.mp3`.

- [ ] **Step 3: Remove the recording**

1. Click "Remove" and confirm the prompt.
2. Expect the card to return to "Upload recording" state and the player to fall back to the TTS audio (press play to verify).
3. Confirm in the Blob dashboard that the second file is also gone.

- [ ] **Step 4: Verify the 403 gate with curl**

Grab any meditation ID (from the URL) and run:

```bash
curl -i -X DELETE http://localhost:3333/api/admin/meditations/<id>/recording
```

Expected: HTTP 403 with `{"error":"Forbidden"}` (unauthenticated, not in admin list).

- [ ] **Step 5: Verify client-side size rejection**

Temporarily rename any large (>25 MB) file to `big.mp3`, attempt to upload via the UI. Expect the inline error "File exceeds 25 MB limit" with no network call (check the Network tab — no POST should have been issued).

- [ ] **Step 6: Verify client-side MIME rejection**

Attempt to upload a PNG or TXT file (after renaming its extension to `.mp3` will NOT change `file.type`). Expect the inline error "Unsupported file type: …" with no network call.

- [ ] **Step 7: Stop the dev server and clean up**

Stop `npm run dev`. No code changes to commit from this task.

---

## Task 8: Push env var to Vercel (only when deploying)

**Files:** none (Vercel configuration)

- [ ] **Step 1: Add `ADMIN_USER_IDS` to the linked Vercel project**

Only run this when you're ready to ship to preview/production:

```bash
vercel env add ADMIN_USER_IDS
```

Provide your Clerk user ID (same value as in `.env.local`). Select the environments where you want admin access (Production, Preview, or both).

- [ ] **Step 2: Redeploy and smoke-test on preview**

After the next deploy, open the preview URL, sign in as the admin user, and repeat Task 7 steps 1–3 against the preview deployment to confirm the feature works end-to-end in a Vercel environment with real Blob storage.

---

## Self-review

**Spec coverage:**
- Data model (spec §Data model) → Task 1.
- Admin gate (spec §Admin gate) → Task 2.
- API POST & DELETE (spec §API route) → Tasks 3, 4.
- Player page UI & admin controls (spec §UI) → Tasks 5, 6.
- Testing (spec §Testing): automated tests intentionally skipped — see deviation note at top. Manual smoke test fully covered by Task 7 and maps to spec §Testing §Manual smoke test.
- File changes summary (spec): every new/modified file has a task owning it, except the `.env.example` file — which does not exist in this repo. `ADMIN_USER_IDS` is documented in Task 2 Step 2 and Task 8 instead.

**Placeholder scan:** no TBDs, no "implement later," no "add error handling" hand-waves. Every code step shows the code. Every command shows expected output or a clear pass/fail signal.

**Type consistency:** `AdminRecordingControls` props `{ meditationId, hasRecording }` match the call site in Task 6. `MeditateClient` new props `admin` / `hasRecording` are added to the interface and the usage in Task 6. Route handler function signatures use `params: Promise<{ id: string }>` consistently with Next.js 16. The `isAdmin(userId)` signature is the same in the helper, the API route, and the page component.

No issues found.
