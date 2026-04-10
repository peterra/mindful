import { getDb } from "@/db";
import { achievements, sessions, streaks } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

interface AchievementDef {
  type: string;
  name: string;
  description: string;
  icon: string;
  check: (stats: UserStats) => boolean;
}

interface UserStats {
  totalSessions: number;
  totalMinutes: number;
  currentStreak: number;
  longestStreak: number;
  categoriesTried: number;
  longestSessionMinutes: number;
}

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  // Session milestones
  {
    type: "sessions_1",
    name: "First Step",
    description: "Complete your first meditation",
    icon: "🌱",
    check: (s) => s.totalSessions >= 1,
  },
  {
    type: "sessions_10",
    name: "Building Habit",
    description: "Complete 10 meditations",
    icon: "🌿",
    check: (s) => s.totalSessions >= 10,
  },
  {
    type: "sessions_25",
    name: "Committed",
    description: "Complete 25 meditations",
    icon: "🌳",
    check: (s) => s.totalSessions >= 25,
  },
  {
    type: "sessions_50",
    name: "Dedicated",
    description: "Complete 50 meditations",
    icon: "🏔️",
    check: (s) => s.totalSessions >= 50,
  },
  {
    type: "sessions_100",
    name: "Centurion",
    description: "Complete 100 meditations",
    icon: "⭐",
    check: (s) => s.totalSessions >= 100,
  },
  {
    type: "sessions_365",
    name: "Year of Presence",
    description: "Complete 365 meditations",
    icon: "🌟",
    check: (s) => s.totalSessions >= 365,
  },

  // Streak milestones
  {
    type: "streak_3",
    name: "Three-peat",
    description: "Maintain a 3-day streak",
    icon: "🔥",
    check: (s) => s.longestStreak >= 3,
  },
  {
    type: "streak_7",
    name: "Full Week",
    description: "Maintain a 7-day streak",
    icon: "💪",
    check: (s) => s.longestStreak >= 7,
  },
  {
    type: "streak_14",
    name: "Fortnight",
    description: "Maintain a 14-day streak",
    icon: "🏆",
    check: (s) => s.longestStreak >= 14,
  },
  {
    type: "streak_30",
    name: "Monthly Master",
    description: "Maintain a 30-day streak",
    icon: "👑",
    check: (s) => s.longestStreak >= 30,
  },
  {
    type: "streak_60",
    name: "Two Months Strong",
    description: "Maintain a 60-day streak",
    icon: "💎",
    check: (s) => s.longestStreak >= 60,
  },
  {
    type: "streak_100",
    name: "Unbreakable",
    description: "Maintain a 100-day streak",
    icon: "🏅",
    check: (s) => s.longestStreak >= 100,
  },

  // Time milestones
  {
    type: "hours_1",
    name: "First Hour",
    description: "Meditate for a total of 1 hour",
    icon: "⏱️",
    check: (s) => s.totalMinutes >= 60,
  },
  {
    type: "hours_10",
    name: "Ten Hours",
    description: "Meditate for a total of 10 hours",
    icon: "🕐",
    check: (s) => s.totalMinutes >= 600,
  },
  {
    type: "hours_50",
    name: "Fifty Hours",
    description: "Meditate for a total of 50 hours",
    icon: "🕰️",
    check: (s) => s.totalMinutes >= 3000,
  },
  {
    type: "hours_100",
    name: "Hundred Hours",
    description: "Meditate for a total of 100 hours",
    icon: "🧘",
    check: (s) => s.totalMinutes >= 6000,
  },

  // Exploration
  {
    type: "explorer",
    name: "Explorer",
    description: "Try all 7 meditation categories",
    icon: "🗺️",
    check: (s) => s.categoriesTried >= 7,
  },
  {
    type: "long_10",
    name: "Deep Diver",
    description: "Complete a 10-minute session",
    icon: "🌊",
    check: (s) => s.longestSessionMinutes >= 10,
  },
  {
    type: "long_20",
    name: "Marathon Meditator",
    description: "Complete a 20-minute session",
    icon: "🏊",
    check: (s) => s.longestSessionMinutes >= 20,
  },
];

export async function checkAndAwardAchievements(userId: string) {
  const db = getDb();

  // Get current stats
  const [sessionStats] = await db
    .select({
      totalSessions: sql<number>`count(*)::int`,
      totalMinutes: sql<number>`coalesce(sum(${sessions.durationSeconds}), 0)::int / 60`,
      categoriesTried: sql<number>`count(distinct (
        select ${sessions.meditationId}
      ))`,
      longestSessionMinutes: sql<number>`coalesce(max(${sessions.durationSeconds}), 0)::int / 60`,
    })
    .from(sessions)
    .where(eq(sessions.userId, userId));

  // Get distinct categories tried
  const categories = await db
    .selectDistinct({ category: sql<string>`m.category` })
    .from(sessions)
    .innerJoin(
      sql`(select id, category from meditations) as m`,
      sql`m.id = ${sessions.meditationId}`
    )
    .where(eq(sessions.userId, userId));

  const streak = await db.query.streaks.findFirst({
    where: eq(streaks.userId, userId),
  });

  const stats: UserStats = {
    totalSessions: sessionStats?.totalSessions ?? 0,
    totalMinutes: sessionStats?.totalMinutes ?? 0,
    currentStreak: streak?.currentStreak ?? 0,
    longestStreak: streak?.longestStreak ?? 0,
    categoriesTried: categories.length,
    longestSessionMinutes: sessionStats?.longestSessionMinutes ?? 0,
  };

  // Get already-awarded achievements
  const awarded = await db.query.achievements.findMany({
    where: eq(achievements.userId, userId),
  });
  const awardedTypes = new Set(awarded.map((a) => a.achievementType));

  // Check and award new achievements
  const newAchievements: string[] = [];
  for (const def of ACHIEVEMENT_DEFS) {
    if (!awardedTypes.has(def.type) && def.check(stats)) {
      await db.insert(achievements).values({
        userId,
        achievementType: def.type,
      });
      newAchievements.push(def.type);
    }
  }

  return newAchievements;
}
