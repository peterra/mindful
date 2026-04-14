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
