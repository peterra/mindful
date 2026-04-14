# Pre-recorded voice upload — design

**Date:** 2026-04-14
**Status:** Draft — pending review

## Goal

Let an admin replace a meditation's TTS-generated audio with an uploaded human recording, from inside the app, with a one-click fallback to the original TTS version. No new concept of "voice" — this operates on a single meditation at a time.

## Scope

In:
- A new nullable column `meditations.recorded_audio_url`.
- A Clerk-based admin gate driven by an `ADMIN_USER_IDS` env var.
- An API route that accepts an MP3/M4A upload, stores it in Vercel Blob, and writes the URL to the meditation row. Also handles removal.
- Admin-only upload/remove controls rendered below the player on `/meditate/[id]`, hidden for everyone else.

Out:
- Tightening the existing `/api/admin/generate-audio` gate (separate follow-up).
- Bulk admin page for managing recordings across the library.
- Per-user personal recordings.
- Audio preview / trim / waveform before upload.
- Any change to the in-player voice settings panel or browser-SpeechSynthesis path.

## Data model

Add one column to `meditations` (`src/db/schema.ts`):

```ts
recordedAudioUrl: text("recorded_audio_url"),
```

Nullable. No default. Drizzle migration generated via the project's existing migration flow.

**Resolution rule:** `meditation.recordedAudioUrl ?? meditation.audioUrl`. If a recording exists, it wins for everyone. To return to TTS, the admin removes the recording. No separate flag or toggle — presence/absence is the entire state machine.

`audioUrl` is left unchanged throughout, so TTS stays available as a fallback without re-running `generateMeditationAudio`.

## Admin gate

New module `src/lib/admin.ts`:

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

- New env var `ADMIN_USER_IDS` — comma-separated Clerk user IDs. Added locally via `.env.local` and to Vercel via `vercel env add ADMIN_USER_IDS`.
- Used in two places: the new API route (authoritative) and the server component for `/meditate/[id]` (to decide whether to render the admin controls).
- Existing `/api/admin/generate-audio` is not modified in this feature; its `auth()`-only gate stays as-is.

## API route

`src/app/api/admin/meditations/[id]/recording/route.ts` — two handlers.

### POST — upload

- Auth: `const { userId } = await auth();` → `if (!isAdmin(userId)) return 403;`.
- Body: `multipart/form-data` with a `file` field (parsed via `request.formData()`).
- Validation:
  - File present.
  - `file.type` in `["audio/mpeg", "audio/mp4", "audio/x-m4a"]`.
  - `file.size <= 25 * 1024 * 1024` (25 MB).
  - Meditation row exists (`db.query.meditations.findFirst`).
- Storage: `put(\`meditations/${id}-recorded-${Date.now()}.${ext}\`, file, { access: "public", contentType: file.type })`. The timestamp suffix avoids CDN cache collisions when replacing.
- If the meditation already has a `recordedAudioUrl`, `del(oldUrl)` from `@vercel/blob` before writing the new row (best-effort; log and continue on failure).
- Update `meditations.recordedAudioUrl` to the new blob URL.
- Response: `{ url: string }` on success. Plain JSON error responses with appropriate status codes otherwise.

### DELETE — remove

- Auth: same admin gate.
- Read current `recordedAudioUrl`; if non-null, `del()` it from Blob (best-effort).
- Update `meditations.recordedAudioUrl = null`.
- Response: `{ ok: true }`.

No PATCH / toggle endpoint — presence of `recordedAudioUrl` is the only state.

## UI

### Player page

`src/app/(app)/meditate/[id]/page.tsx` (server component):

- `const audioSrc = meditation.recordedAudioUrl ?? meditation.audioUrl;` — passed to `MeditationPlayer` in place of the current `audioUrl` prop.
- `const admin = isAdmin(userId);` — computed from `auth()`.
- If `admin`, render `<AdminRecordingControls meditationId={meditation.id} hasRecording={!!meditation.recordedAudioUrl} />` below the player. Non-admins see nothing new; the player layout is unchanged.

### `<AdminRecordingControls>` — new client component

`src/components/admin-recording-controls.tsx`.

Props: `{ meditationId: string; hasRecording: boolean }`.

Behavior:
- Hidden file input with `accept="audio/mpeg,audio/mp4,audio/x-m4a"`.
- **No recording present:** a single "Upload recording" button triggers the file input.
- **Recording present:** a "Using uploaded recording" label plus two buttons — "Replace" (same upload flow) and "Remove" (DELETE after a `confirm()` check).
- On file select: client-side pre-check of size (≤25 MB) and MIME. Reject inline with a readable error before any network call.
- Upload via `fetch('/api/admin/meditations/${id}/recording', { method: 'POST', body: formData })`. Remove via same URL with `method: 'DELETE'`.
- Local state: `idle | uploading | removing | error: string`. Surface `uploading` / `removing` via disabled buttons and a small status line; surface errors inline.
- On success: `router.refresh()` to re-fetch the server component and reload the player with the new URL. No optimistic state — the page re-renders authoritatively.

Styling follows the existing tokens/shadcn conventions used in `profile/preferences-form.tsx` and `meditation-player.tsx`.

## Testing

### Unit tests

- `isAdmin()` — `true` for IDs present in `ADMIN_USER_IDS`, `false` for missing user, empty env, or non-matching ID. Covers trimming and empty-segment handling.
- API route POST — rejects non-admin (403), missing file (400), oversized file (400), wrong MIME (400); on success calls `put`, writes DB, returns `{ url }`. Blob `put`/`del` and Drizzle calls mocked.
- API route DELETE — rejects non-admin (403); on success calls `del` (when URL present) and nulls DB column.

Framework: whatever the repo already has (Vitest is most likely — confirm during implementation).

### Manual smoke test

Run the dev server (port 3333) and, with the caller's Clerk ID in `ADMIN_USER_IDS`:

1. Open `/meditate/[id]`, upload a small MP3, confirm the player reloads and plays the new recording.
2. Click "Replace" with a second MP3, confirm it swaps; check the Vercel Blob dashboard to confirm the first file was deleted.
3. Click "Remove", confirm the player falls back to the TTS URL and the Blob file is gone.
4. Open the same page as a non-admin user (incognito + different Clerk account), confirm admin controls are not rendered.
5. Attempt to POST to the route as a non-admin via `curl` — expect 403.

## File changes summary

New:
- `src/lib/admin.ts`
- `src/app/api/admin/meditations/[id]/recording/route.ts`
- `src/components/admin-recording-controls.tsx`
- Drizzle migration for the new column
- Tests for `isAdmin` and the API route

Modified:
- `src/db/schema.ts` — add `recordedAudioUrl` column
- `src/app/(app)/meditate/[id]/page.tsx` — resolve `audioSrc`, render admin controls
- `.env.example` (if present) — document `ADMIN_USER_IDS`

## Open questions

None blocking. Size cap (25 MB) and accepted MIME types (MP3, M4A) are defaults the reviewer can override.
