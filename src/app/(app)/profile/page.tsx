import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { UserProfile } from "@clerk/nextjs";
import { getDb } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PreferencesForm } from "./preferences-form";

export default async function ProfilePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const db = getDb();
  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
  });

  if (!user) redirect("/onboarding");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Profile</h1>
        <p className="text-muted-foreground">
          Manage your meditation preferences
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Meditation Preferences</CardTitle>
        </CardHeader>
        <CardContent>
          <PreferencesForm
            focusAreas={user.focusAreas ?? []}
            preferredDuration={user.preferredDuration ?? 5}
            preferredVoice={user.preferredVoice ?? "shimmer"}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent>
          <UserProfile
            appearance={{
              elements: {
                rootBox: "w-full",
                cardBox: "shadow-none w-full",
              },
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
