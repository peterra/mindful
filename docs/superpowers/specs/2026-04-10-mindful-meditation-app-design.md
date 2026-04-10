# Mindful — Guided Meditation App Design Spec

## Overview

A web-based guided meditation app that helps people build mindfulness skills through AI-narrated audio sessions, personalized recommendations, and gamified progress tracking. Targets all experience levels with strong beginner onboarding.

## Stack

- **Framework:** Next.js 15 (App Router)
- **Auth:** Clerk (Vercel Marketplace)
- **Database:** Neon Postgres (Vercel Marketplace) + Drizzle ORM
- **TTS:** OpenAI TTS API (`tts-1-hd`, `shimmer` voice default)
- **Audio Storage:** Vercel Blob
- **Styling:** Tailwind CSS + shadcn/ui
- **Deployment:** Vercel

## User Experience Flow

### Landing Page
Calm, minimal design. Value prop: "Build a meditation practice with personalized AI-guided sessions." CTA to sign up.

### Onboarding (post sign-up)
1. Experience level: never / a few times / regular practice
2. Focus areas: stress relief, focus, sleep, emotional balance, general wellness
3. Preferred session length: 3min, 5min, 10min, 15min, 20min
4. Generates personalized first session recommendation

### Dashboard (Home)
- Today's recommended session
- Current streak and total minutes meditated
- Quick-start buttons for different session types
- Progress toward next milestone

### Meditation Player
- Audio player with AI-narrated meditation
- Calming background visuals (gradient animations)
- Session timer with progress indicator
- Pause/resume controls
- Post-session reflection: mood check + optional journal note

### Library
Browse/search meditations by:
- Category (breath, body scan, stress, focus, sleep, loving-kindness, morning)
- Duration (3min–20min)
- Difficulty level

### Progress Page
- Streak calendar (GitHub contribution graph style)
- Achievement gallery with unlocked/locked states
- Detailed stats: total sessions, total time, favorite category

### Profile
- Edit preferences (focus areas, default session length)
- Voice selection (shimmer / nova)
- Account settings

## Pages & Routes

| Route | Purpose |
|-------|---------|
| `/` | Landing page (marketing) |
| `/sign-in`, `/sign-up` | Clerk auth pages |
| `/onboarding` | Post-signup preference wizard |
| `/dashboard` | Home — streaks, recommended session, quick starts |
| `/meditate/[id]` | Meditation player |
| `/library` | Browse all meditations |
| `/progress` | Stats, achievements, streak calendar |
| `/profile` | User preferences and account settings |

Navigation: bottom nav (mobile) / sidebar (desktop) — Home, Library, Progress, Profile.

## Data Models

### users
Managed by Clerk. Extended in our DB with:
- `clerk_id` (string, unique)
- `experience_level` (enum: beginner, some_experience, regular)
- `focus_areas` (text array)
- `preferred_duration` (integer, minutes)
- `preferred_voice` (string, default: shimmer)
- `created_at`, `updated_at`

### meditations
- `id` (uuid)
- `title` (string)
- `description` (text)
- `category` (enum: breath, body_scan, stress, focus, sleep, loving_kindness, morning)
- `duration_seconds` (integer)
- `difficulty` (enum: beginner, intermediate, advanced)
- `script` (text — the full meditation narration text)
- `audio_url` (string, nullable — Vercel Blob URL)
- `voice` (string — TTS voice used)
- `created_at`

### sessions (user meditation completions)
- `id` (uuid)
- `user_id` (references users.clerk_id)
- `meditation_id` (references meditations.id)
- `completed_at` (timestamp)
- `duration_seconds` (integer — actual time spent)
- `mood_before` (integer 1-5, nullable)
- `mood_after` (integer 1-5, nullable)
- `journal_note` (text, nullable)

### streaks
- `user_id` (references users.clerk_id, unique)
- `current_streak` (integer)
- `longest_streak` (integer)
- `last_session_date` (date)
- `freeze_available` (boolean, default: false)

### achievements
- `id` (uuid)
- `user_id` (references users.clerk_id)
- `achievement_type` (string — e.g., "sessions_10", "streak_7", "hours_1")
- `unlocked_at` (timestamp)

## Audio Generation Flow

1. Meditation scripts are stored as text in the `meditations` table
2. On first request (or via admin/seed script), script is sent to OpenAI TTS API
3. Generated MP3 is uploaded to Vercel Blob
4. `audio_url` field is updated with the Blob URL
5. Subsequent plays stream directly from Blob

Fallback: if audio generation fails, display the script as on-screen text guidance with a retry option.

## Progression & Gamification

### Streaks
- Daily streak increments when user completes at least one session per day
- Streak freeze earned every 7-day streak (protects one missed day)
- Visual streak calendar on progress page

### Achievements
| Category | Milestones |
|----------|-----------|
| Sessions | 1, 10, 25, 50, 100, 365 |
| Streaks | 3, 7, 14, 30, 60, 100 days |
| Total time | 1hr, 10hr, 50hr, 100hr |
| Exploration | All categories tried, first 10min, first 20min |

Each achievement has a name, icon, and encouraging description.

### Skill Levels
Based on total sessions + variety of techniques:
- Beginner (0-9 sessions)
- Novice (10-24)
- Practitioner (25-49)
- Adept (50-99)
- Mindful (100+)

Higher levels unlock longer sessions and advanced techniques.

## Seed Content (v1)

16 meditation scripts across 7 categories:

| Category | Scripts | Durations |
|----------|---------|-----------|
| Breath awareness | 3 | 3min, 5min, 10min |
| Body scan | 2 | 5min, 10min |
| Stress relief | 3 | 3min, 5min, 10min |
| Focus & concentration | 2 | 5min, 10min |
| Sleep | 2 | 10min, 15min |
| Loving-kindness | 2 | 5min, 10min |
| Morning start | 2 | 3min, 5min |

### Script Structure
1. Welcome + settling in (~30s)
2. Core technique instruction (varies)
3. Guided practice (bulk of session)
4. Gentle return to awareness (~30s)
5. Closing encouragement (~15s)

## Recommendation Logic (v1)

"Today's recommended session" on the dashboard uses a simple algorithm:
1. Filter meditations matching user's focus areas and difficulty level
2. Exclude sessions completed in the last 3 days (encourage variety)
3. Prefer sessions at the user's preferred duration
4. Random selection from remaining candidates
5. If no candidates, pick any session at their preferred duration

No ML or complex personalization in v1.

## Error Handling
- Audio generation failure: show text-based fallback with retry option
- Network issues: graceful offline indicator
- Auth errors: redirect to sign-in with return URL
- Empty states: encouraging messages ("Start your first session!" not blank pages)

## Future Considerations (not v1)
- PWA support for offline cached sessions
- AI-personalized scripts via Claude API based on mood/preferences
- Social features (friends, group meditations)
- Notifications/reminders
- Walking meditation / timer-only mode
- Multiple voice options beyond shimmer/nova
