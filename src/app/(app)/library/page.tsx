import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Play } from "lucide-react";
import { getDb } from "@/db";
import { meditations } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const CATEGORIES = [
  { value: "all", label: "All" },
  { value: "breath", label: "Breath" },
  { value: "body_scan", label: "Body Scan" },
  { value: "stress", label: "Stress Relief" },
  { value: "focus", label: "Focus" },
  { value: "sleep", label: "Sleep" },
  { value: "loving_kindness", label: "Loving-Kindness" },
  { value: "morning", label: "Morning" },
];

const DIFFICULTY_LABELS: Record<string, string> = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export default async function LibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; duration?: string }>;
}) {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const { category, duration } = await searchParams;
  const db = getDb();

  const conditions = [];
  if (category && category !== "all") {
    conditions.push(
      sql`${meditations.category} = ${category}`
    );
  }
  if (duration) {
    const maxSeconds = parseInt(duration, 10) * 60;
    conditions.push(sql`${meditations.durationSeconds} <= ${maxSeconds}`);
  }

  const allMeditations = await db.query.meditations.findMany({
    where: conditions.length > 0 ? and(...conditions) : undefined,
    orderBy: (m, { asc }) => [asc(m.category), asc(m.durationSeconds)],
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Library</h1>
        <p className="text-muted-foreground">
          Explore guided meditations across different techniques
        </p>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => {
          const isActive =
            cat.value === (category ?? "all") ||
            (!category && cat.value === "all");
          return (
            <Link
              key={cat.value}
              href={
                cat.value === "all"
                  ? "/library"
                  : `/library?category=${cat.value}`
              }
            >
              <Badge
                variant={isActive ? "default" : "outline"}
                className={cn(
                  "cursor-pointer px-3 py-1.5 text-sm",
                  isActive && "bg-primary text-primary-foreground"
                )}
              >
                {cat.label}
              </Badge>
            </Link>
          );
        })}
      </div>

      {/* Meditation grid */}
      {allMeditations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No meditations found for these filters. Try a different category.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {allMeditations.map((m) => (
            <Link key={m.id} href={`/meditate/${m.id}`}>
              <Card className="group cursor-pointer transition-colors hover:bg-muted/50">
                <CardContent className="flex items-start justify-between p-5">
                  <div className="flex-1">
                    <h3 className="font-semibold group-hover:text-primary">
                      {m.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {m.description}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {Math.round(m.durationSeconds / 60)} min
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {DIFFICULTY_LABELS[m.difficulty]}
                      </Badge>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="ml-3 mt-1 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                  >
                    <Play className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
