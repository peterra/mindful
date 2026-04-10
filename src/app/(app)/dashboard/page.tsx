import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Flame,
  Clock,
  Trophy,
  Play,
  Wind,
  Scan,
  Heart,
  Brain,
  Moon,
  Flower2,
  Sun,
} from "lucide-react";
import { getDb } from "@/db";
import { users, sessions, streaks } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getRecommendedMeditation } from "@/lib/recommendations";
import { getLevel } from "@/lib/levels";

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  breath: Wind,
  body_scan: Scan,
  stress: Heart,
  focus: Brain,
  sleep: Moon,
  loving_kindness: Flower2,
  morning: Sun,
};

const CATEGORY_LABELS: Record<string, string> = {
  breath: "Breath",
  body_scan: "Body Scan",
  stress: "Stress Relief",
  focus: "Focus",
  sleep: "Sleep",
  loving_kindness: "Loving-Kindness",
  morning: "Morning",
};

export default async function DashboardPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const db = getDb();

  // Check if user has completed onboarding
  const user = await db.query.users.findFirst({
    where: eq(users.clerkId, userId),
  });

  if (!user) redirect("/onboarding");

  // Fetch data in parallel
  const [recommended, streak, sessionStats] = await Promise.all([
    getRecommendedMeditation(userId),
    db.query.streaks.findFirst({ where: eq(streaks.userId, userId) }),
    db
      .select({
        totalSessions: sql<number>`count(*)::int`,
        totalMinutes: sql<number>`coalesce(sum(${sessions.durationSeconds}), 0)::int / 60`,
      })
      .from(sessions)
      .where(eq(sessions.userId, userId))
      .then((rows) => rows[0]),
  ]);

  const level = getLevel(sessionStats?.totalSessions ?? 0);

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="text-muted-foreground">
          Ready for today&apos;s practice?
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Flame className="h-5 w-5 text-orange-500" />
            <div>
              <div className="text-2xl font-bold">
                {streak?.currentStreak ?? 0}
              </div>
              <div className="text-xs text-muted-foreground">day streak</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Clock className="h-5 w-5 text-primary" />
            <div>
              <div className="text-2xl font-bold">
                {sessionStats?.totalMinutes ?? 0}
              </div>
              <div className="text-xs text-muted-foreground">minutes</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3 pt-6">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <div>
              <div className="text-2xl font-bold">{level.current.name}</div>
              <div className="text-xs text-muted-foreground">level</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Level progress */}
      {level.next && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Progress to {level.next.name}
            </span>
            <span className="font-medium">
              {Math.round(level.progress * 100)}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-muted">
            <div
              className="h-2 rounded-full bg-primary transition-all"
              style={{ width: `${level.progress * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Recommended session */}
      {recommended && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                Today&apos;s Recommendation
              </CardTitle>
              <Badge variant="secondary">
                {Math.round(recommended.durationSeconds / 60)} min
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <h3 className="text-lg font-semibold">{recommended.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              {recommended.description}
            </p>
            <Link href={`/meditate/${recommended.id}`}>
              <Button className="mt-4 w-full gap-2">
                <Play className="h-4 w-4" />
                Begin Session
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Quick start by category */}
      <div>
        <h2 className="mb-3 text-lg font-semibold">Quick Start</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
            const Icon = CATEGORY_ICONS[key] ?? Wind;
            return (
              <Link key={key} href={`/library?category=${key}`}>
                <Card className="cursor-pointer transition-colors hover:bg-muted/50">
                  <CardContent className="flex flex-col items-center gap-2 p-4">
                    <Icon className="h-6 w-6 text-primary" />
                    <span className="text-xs font-medium">{label}</span>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
