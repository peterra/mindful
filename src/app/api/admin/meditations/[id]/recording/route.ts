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
