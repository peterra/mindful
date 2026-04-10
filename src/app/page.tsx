import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { Sparkles, Headphones, BarChart3, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function LandingPage() {
  const { userId } = await auth();
  if (userId) redirect("/dashboard");

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="text-lg font-semibold">Mindful</span>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/sign-in">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button size="sm">Get started</Button>
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Build a meditation practice that{" "}
            <span className="text-primary">sticks</span>
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Personalized AI-guided meditation sessions that meet you where you
            are. From your first breath to your hundredth hour — Mindful grows
            with you.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/sign-up">
              <Button size="lg" className="w-full sm:w-auto">
                Start your journey
              </Button>
            </Link>
            <Link href="/sign-in">
              <Button variant="outline" size="lg" className="w-full sm:w-auto">
                I have an account
              </Button>
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="mt-20 grid max-w-3xl gap-8 sm:grid-cols-3">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Headphones className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold">AI-Guided Sessions</h3>
            <p className="text-sm text-muted-foreground">
              Beautiful audio meditations crafted by AI, covering breath work,
              body scans, stress relief, and more.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/30">
              <BarChart3 className="h-6 w-6 text-accent-foreground" />
            </div>
            <h3 className="font-semibold">Track Your Growth</h3>
            <p className="text-sm text-muted-foreground">
              Build streaks, unlock achievements, and watch your mindfulness
              practice deepen over time.
            </p>
          </div>
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <Heart className="h-6 w-6 text-primary" />
            </div>
            <h3 className="font-semibold">Made for You</h3>
            <p className="text-sm text-muted-foreground">
              Personalized recommendations based on your goals, experience, and
              how you&apos;re feeling.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-sm text-muted-foreground">
        <p>Built with presence and purpose.</p>
      </footer>
    </div>
  );
}
