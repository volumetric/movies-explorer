"use client";

import posthog from "posthog-js";
import { PostHogProvider as PHProvider } from "posthog-js/react";
import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";

export function PostHogProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
      posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
        api_host:
          process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://app.posthog.com",
        capture_pageview: false, // We'll capture manually
        capture_pageleave: true,
      });
    }
  }, []);

  return <PHProvider client={posthog}>{children}</PHProvider>;
}

export function PostHogIdentify() {
  const { user, isSignedIn } = useUser();

  useEffect(() => {
    if (isSignedIn && user) {
      posthog.identify(user.id, {
        email: user.emailAddresses[0]?.emailAddress,
        name: user.fullName,
      });
    } else {
      posthog.reset();
    }
  }, [isSignedIn, user]);

  return null;
}

// Custom events for tracking
export const trackEvent = {
  movieSearched: (query: string) => {
    posthog.capture("movie_searched", { query });
  },
  discoveryStarted: (movieId: number, movieTitle: string, mode: "director" | "studio") => {
    posthog.capture("discovery_started", { movieId, movieTitle, mode });
  },
  movieAddedToFavorites: (movieId: number, movieTitle: string) => {
    posthog.capture("movie_added_to_favorites", { movieId, movieTitle });
  },
  movieAddedToWatchlist: (movieId: number, movieTitle: string) => {
    posthog.capture("movie_added_to_watchlist", { movieId, movieTitle });
  },
  recommendationClicked: (movieId: number, movieTitle: string, score: number) => {
    posthog.capture("recommendation_clicked", { movieId, movieTitle, score });
  },
  discoveryModeToggled: (mode: "director" | "studio") => {
    posthog.capture("discovery_mode_toggled", { mode });
  },
};
