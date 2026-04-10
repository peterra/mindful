import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Flame, Clock, Hash, Trophy } from "lucide-react";
import { getDb } from "@/db";
import { sessions, streaks, achievements } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ACHIEVEMENT_DEFS } from "@/lib/achievements";
import { getLevel } from "@/lib/levels";
import { cn } from "@/lib/utils";

export default async function ProgressPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const db = getDb();

  const [streak, sessionStats, userAchievements, recentSessions] =
    await Promise.all([
      db.query.streaks.findFirst({ where: eq(streaks.userId, userId) }),
      db
        .select({
          totalSessions: sql<number>`count(*)::int`,
          totalMinutes: sql<number>`coalesce(sum(${sessions.durationSeconds}), 0)::int / 60`,
        })
        .from(sessions)
        .where(eq(sessions.userId, userId))
        .then((rows) => rows[0]),
      db.query.achievements.findMany({
        where: eq(achievements.userId, userId),
      }),
      // Last 90 days of sessions for the calendar
      db
        .select({
          date: sql<string>`date(${sessions.completedAt})`,
          count: sql<number>`count(*)::int`,
        })
        .from(sessions)
        .where(
          sql`${sessions.userId} = ${userId} AND ${sessions.completedAt} > now() - interval '90 days'`
        )
        .groupBy(sql`date(${sessions.completedAt})`),
    ]);

  const totalSessions = sessionStats?.totalSessions ?? 0;
  const totalMinutes = sessionStats?.totalMinutes ?? 0;
  const level = getLevel(totalSessions);
  const awardedTypes = new Set(userAchievements.map((a) => a.achievementType));

  // Build calendar data for last 90 days
  const sessionMap = new Map(recentSessions.map((s) => [s.date, s.count]));
  const calendarDays: { date: string; count: number }[] = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    calendarDays.push({ date: dateStr, count: sessionMap.get(dateStr) ?? 0 });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Your Progress</h1>
        <p className="text-muted-foreground">
          Track your mindfulness journey over time
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="flex flex-col items-center pt-6">
            <Flame className="h-5 w-5 text-orange-500" />
            <div className="mt-2 text-2xl font-bold">
              {streak?.currentStreak ?? 0}
            </div>
            <div className="text-xs text-muted-foreground">current streak</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center pt-6">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <div className="mt-2 text-2xl font-bold">
              {streak?.longestStreak ?? 0}
            </div>
            <div className="text-xs text-muted-foreground">best streak</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center pt-6">
            <Hash className="h-5 w-5 text-primary" />
            <div className="mt-2 text-2xl font-bold">{totalSessions}</div>
            <div className="text-xs text-muted-foreground">sessions</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex flex-col items-center pt-6">
            <Clock className="h-5 w-5 text-primary" />
            <div className="mt-2 text-2xl font-bold">{totalMinutes}</div>
            <div className="text-xs text-muted-foreground">minutes</div>
          </CardContent>
        </Card>
      </div>

      {/* Level */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Skill Level</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">{level.current.name}</span>
            {level.next && (
              <span className="text-sm text-muted-foreground">
                Next: {level.next.name}
              </span>
            )}
          </div>
          <div className="mt-2 h-3 rounded-full bg-muted">
            <div
              className="h-3 rounded-full bg-primary transition-all"
              style={{ width: `${level.progress * 100}%` }}
            />
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground">
            {totalSessions} sessions
            {level.next && ` — ${level.next.minSessions - totalSessions} more to ${level.next.name}`}
          </p>
        </CardContent>
      </Card>

      {/* Practice calendar */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Practice Calendar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-1">
            {calendarDays.map((day) => (
              <div
                key={day.date}
                title={`${day.date}: ${day.count} session${day.count !== 1 ? "s" : ""}`}
                className={cn(
                  "h-3 w-3 rounded-sm",
                  day.count === 0 && "bg-muted",
                  day.count === 1 && "bg-primary/40",
                  day.count === 2 && "bg-primary/60",
                  day.count >= 3 && "bg-primary"
                )}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Last 90 days of practice
          </p>
        </CardContent>
      </Card>

      {/* Achievements */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">
            Achievements ({userAchievements.length}/{ACHIEVEMENT_DEFS.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {ACHIEVEMENT_DEFS.map((def) => {
              const unlocked = awardedTypes.has(def.type);
              return (
                <div
                  key={def.type}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border p-3",
                    unlocked
                      ? "border-primary/20 bg-primary/5"
                      : "border-border opacity-40"
                  )}
                >
                  <span className="text-2xl">{def.icon}</span>
                  <div>
                    <div className="text-sm font-medium">{def.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {def.description}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
