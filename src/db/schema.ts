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

export const experienceLevelEnum = pgEnum("experience_level", [
  "beginner",
  "some_experience",
  "regular",
]);

export const categoryEnum = pgEnum("category", [
  "breath",
  "body_scan",
  "stress",
  "focus",
  "sleep",
  "loving_kindness",
  "morning",
]);

export const difficultyEnum = pgEnum("difficulty", [
  "beginner",
  "intermediate",
  "advanced",
]);

export const users = pgTable("users", {
  clerkId: text("clerk_id").primaryKey(),
  experienceLevel: experienceLevelEnum("experience_level"),
  focusAreas: text("focus_areas").array(),
  preferredDuration: integer("preferred_duration").default(5),
  preferredVoice: text("preferred_voice").default("shimmer"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const meditations = pgTable("meditations", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  category: categoryEnum("category").notNull(),
  durationSeconds: integer("duration_seconds").notNull(),
  difficulty: difficultyEnum("difficulty").notNull(),
  script: text("script").notNull(),
  audioUrl: text("audio_url"),
  voice: text("voice").default("shimmer"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .references(() => users.clerkId)
    .notNull(),
  meditationId: uuid("meditation_id")
    .references(() => meditations.id)
    .notNull(),
  completedAt: timestamp("completed_at").defaultNow().notNull(),
  durationSeconds: integer("duration_seconds").notNull(),
  moodBefore: integer("mood_before"),
  moodAfter: integer("mood_after"),
  journalNote: text("journal_note"),
});

export const streaks = pgTable("streaks", {
  userId: text("user_id")
    .references(() => users.clerkId)
    .primaryKey(),
  currentStreak: integer("current_streak").default(0).notNull(),
  longestStreak: integer("longest_streak").default(0).notNull(),
  lastSessionDate: date("last_session_date"),
  freezeAvailable: boolean("freeze_available").default(false).notNull(),
});

export const achievements = pgTable("achievements", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id")
    .references(() => users.clerkId)
    .notNull(),
  achievementType: text("achievement_type").notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
});
