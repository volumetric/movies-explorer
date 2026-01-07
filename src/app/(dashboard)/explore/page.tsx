"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { Film } from "lucide-react";

import { api } from "../../../../convex/_generated/api";
import { MovieSearch } from "@/components/movie/movie-search";
import { DiscoveryContainer } from "@/components/discovery/discovery-container";

interface SelectedMovie {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  releaseYear: number;
  voteAverage?: number;
}

export default function ExplorePage() {
  const { user, isLoaded } = useUser();
  const [selectedMovie, setSelectedMovie] = useState<SelectedMovie | null>(null);

  // Ensure user exists in Convex
  const createUser = useMutation(api.users.createUser);
  const convexUser = useQuery(
    api.users.getUser,
    user?.id ? { clerkId: user.id } : "skip"
  );

  useEffect(() => {
    if (user && !convexUser) {
      createUser({
        clerkId: user.id,
        email: user.emailAddresses[0]?.emailAddress || "",
        name: user.fullName || undefined,
        imageUrl: user.imageUrl || undefined,
      });
    }
  }, [user, convexUser, createUser]);

  const handleSelectMovie = (movie: SelectedMovie) => {
    setSelectedMovie(movie);
  };

  const handleBack = () => {
    setSelectedMovie(null);
  };

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {!selectedMovie ? (
        // Search view
        <div className="space-y-8">
          <div className="text-center py-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Film className="h-10 w-10 text-primary" />
              <h1 className="text-3xl font-bold">Explore Movies</h1>
            </div>
            <p className="text-muted-foreground max-w-md mx-auto">
              Search for a movie you love, then discover other great films from
              the same director or studio.
            </p>
          </div>

          <div className="max-w-xl mx-auto">
            <MovieSearch
              onSelectMovie={handleSelectMovie}
              placeholder="Search for a movie to start exploring..."
            />
          </div>

          {/* Recent favorites quick access could go here */}
        </div>
      ) : (
        // Discovery view
        <DiscoveryContainer
          selectedMovie={selectedMovie}
          onBack={handleBack}
        />
      )}
    </div>
  );
}
