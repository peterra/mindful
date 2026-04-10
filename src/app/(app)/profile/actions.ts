"use server";

import { auth } from "@clerk/nextjs/server";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function updatePreferences(formData: FormData) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const focusAreas = formData.getAll("focusAreas") as string[];
  const preferredDuration = parseInt(
    formData.get("preferredDuration") as string,
    10
  );
  const preferredVoice = formData.get("preferredVoice") as string;

  const db = getDb();
  await db
    .update(users)
    .set({
      focusAreas,
      preferredDuration,
      preferredVoice,
      updatedAt: new Date(),
    })
    .where(eq(users.clerkId, userId));

  revalidatePath("/profile");
  revalidatePath("/dashboard");
}
