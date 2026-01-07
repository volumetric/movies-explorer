"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { Heart, Search, Trash2 } from "lucide-react";
import Link from "next/link";

import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { MovieCard } from "@/components/movie/movie-card";
import { MovieGrid } from "@/components/movie/movie-grid";
import { Skeleton } from "@/components/ui/skeleton";

export default function FavoritesPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const convexUser = useQuery(
    api.users.getUser,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const favorites = useQuery(
    api.favorites.getFavorites,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );

  const removeFavorite = useMutation(api.favorites.removeFavorite);
  const toggleWatchlist = useMutation(api.watchlist.toggleWatchlist);

  const filteredFavorites = favorites?.filter((movie) =>
    movie.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRemove = async (tmdbId: number, title: string) => {
    if (!convexUser) return;
    try {
      await removeFavorite({ userId: convexUser._id, tmdbId });
      toast({ title: `Removed "${title}" from favorites` });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove from favorites",
        variant: "destructive",
      });
    }
  };

  const handleToggleWatchlist = async (movie: any) => {
    if (!convexUser) return;
    try {
      const result = await toggleWatchlist({
        userId: convexUser._id,
        tmdbId: movie.tmdbId,
        title: movie.title,
        posterPath: movie.posterPath,
        releaseYear: movie.releaseYear,
      });
      toast({
        title: result.added ? "Added to watchlist" : "Removed from watchlist",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update watchlist",
        variant: "destructive",
      });
    }
  };

  if (!convexUser || favorites === undefined) {
    return (
      <div className="max-w-6xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-60 w-full rounded-lg" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Favorites</h1>
          <span className="text-muted-foreground">
            ({favorites?.length || 0})
          </span>
        </div>
      </div>

      {/* Search */}
      {favorites && favorites.length > 0 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter favorites..."
            className="pl-10"
          />
        </div>
      )}

      {/* Empty state */}
      {favorites && favorites.length === 0 && (
        <div className="text-center py-24">
          <Heart className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No favorites yet</h2>
          <p className="text-muted-foreground mb-6">
            Start exploring movies and add them to your favorites!
          </p>
          <Button asChild>
            <Link href="/explore">Start Exploring</Link>
          </Button>
        </div>
      )}

      {/* Movie grid */}
      {filteredFavorites && filteredFavorites.length > 0 && (
        <MovieGrid>
          {filteredFavorites.map((movie) => (
            <MovieCard
              key={movie._id}
              tmdbId={movie.tmdbId}
              title={movie.title}
              posterPath={movie.posterPath}
              releaseYear={movie.releaseYear}
              isFavorite={true}
              onToggleFavorite={() => handleRemove(movie.tmdbId, movie.title)}
              onToggleWatchlist={() => handleToggleWatchlist(movie)}
              onSelect={() => {
                // Could navigate to explore with this movie selected
              }}
            />
          ))}
        </MovieGrid>
      )}

      {/* No results */}
      {searchQuery && filteredFavorites?.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No favorites match &quot;{searchQuery}&quot;
        </div>
      )}
    </div>
  );
}
