import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { Film, Search, Heart, Clock, ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />

        <div className="relative mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-6">
              <Film className="h-12 w-12 text-primary" />
              <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
                Movie Explorer
              </h1>
            </div>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              Discover your next favorite film by exploring the works of
              directors and studios you already love. Find hidden gems from the
              same creative minds.
            </p>

            <div className="mt-10 flex items-center justify-center gap-4">
              <SignedOut>
                <Button asChild size="lg">
                  <Link href="/sign-up">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <Link href="/sign-in">Sign In</Link>
                </Button>
              </SignedOut>
              <SignedIn>
                <Button asChild size="lg">
                  <Link href="/explore">
                    Start Exploring
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </SignedIn>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold">How It Works</h2>
          <p className="mt-4 text-muted-foreground">
            Three simple steps to discover amazing movies
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          <FeatureCard
            icon={<Search className="h-8 w-8" />}
            title="1. Search a Movie"
            description="Start with a movie you love. Search for any film to begin your discovery journey."
          />
          <FeatureCard
            icon={<Film className="h-8 w-8" />}
            title="2. Explore Connections"
            description="Toggle between the same director or studio to find related films from the same creative team."
          />
          <FeatureCard
            icon={<Heart className="h-8 w-8" />}
            title="3. Build Your Watchlist"
            description="Save recommendations to your watchlist and track what you've watched."
          />
        </div>
      </div>

      {/* Discovery Modes Section */}
      <div className="bg-muted/50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold">Two Ways to Discover</h2>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-xl border bg-card p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <Film className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">By Director</h3>
              </div>
              <p className="text-muted-foreground">
                Explore the complete filmography of a director. Perfect for when
                you love a filmmaker&apos;s unique style and want to see everything
                they&apos;ve created.
              </p>
            </div>

            <div className="rounded-xl border bg-card p-8">
              <div className="flex items-center gap-4 mb-4">
                <div className="rounded-full bg-primary/10 p-3">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">By Studio</h3>
              </div>
              <p className="text-muted-foreground">
                Discover movies from the same production studio. Great for
                finding films with similar production values and aesthetics.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-primary/10 px-6 py-16 text-center">
          <h2 className="text-3xl font-bold">Ready to Discover?</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Join Movie Explorer and start finding your next favorite film today.
          </p>
          <div className="mt-8">
            <SignedOut>
              <Button asChild size="lg">
                <Link href="/sign-up">
                  Create Free Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </SignedOut>
            <SignedIn>
              <Button asChild size="lg">
                <Link href="/explore">
                  Go to Explorer
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </SignedIn>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Film className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Movie Explorer
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Powered by TMDB API
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-6 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <h3 className="mb-2 text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
