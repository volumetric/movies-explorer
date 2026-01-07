"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { Clock, Search, Check, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { MovieCard } from "@/components/movie/movie-card";
import { MovieGrid } from "@/components/movie/movie-grid";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

export default function WatchlistPage() {
  const { user } = useUser();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [tab, setTab] = useState("unwatched");

  const convexUser = useQuery(
    api.users.getUser,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const watchlist = useQuery(
    api.watchlist.getWatchlist,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );

  const removeFromWatchlist = useMutation(api.watchlist.removeFromWatchlist);
  const markAsWatched = useMutation(api.watchlist.markAsWatched);
  const markAsUnwatched = useMutation(api.watchlist.markAsUnwatched);
  const toggleFavorite = useMutation(api.favorites.toggleFavorite);

  const unwatched = watchlist?.filter((m) => !m.watched) || [];
  const watched = watchlist?.filter((m) => m.watched) || [];

  const currentList = tab === "unwatched" ? unwatched : watched;
  const filteredList = currentList.filter((movie) =>
    movie.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRemove = async (tmdbId: number, title: string) => {
    if (!convexUser) return;
    try {
      await removeFromWatchlist({ userId: convexUser._id, tmdbId });
      toast({ title: `Removed "${title}" from watchlist` });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to remove from watchlist",
        variant: "destructive",
      });
    }
  };

  const handleToggleWatched = async (movie: any) => {
    if (!convexUser) return;
    try {
      if (movie.watched) {
        await markAsUnwatched({ userId: convexUser._id, tmdbId: movie.tmdbId });
        toast({ title: "Marked as unwatched" });
      } else {
        await markAsWatched({ userId: convexUser._id, tmdbId: movie.tmdbId });
        toast({ title: "Marked as watched!" });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const handleToggleFavorite = async (movie: any) => {
    if (!convexUser) return;
    try {
      const result = await toggleFavorite({
        userId: convexUser._id,
        tmdbId: movie.tmdbId,
        title: movie.title,
        posterPath: movie.posterPath,
        releaseYear: movie.releaseYear,
      });
      toast({
        title: result.added ? "Added to favorites" : "Removed from favorites",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive",
      });
    }
  };

  if (!convexUser || watchlist === undefined) {
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
          <Clock className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Watchlist</h1>
          <span className="text-muted-foreground">
            ({watchlist?.length || 0})
          </span>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="unwatched" className="flex items-center gap-2">
            <EyeOff className="h-4 w-4" />
            To Watch
            {unwatched.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {unwatched.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="watched" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Watched
            {watched.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {watched.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search */}
      {watchlist && watchlist.length > 0 && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter watchlist..."
            className="pl-10"
          />
        </div>
      )}

      {/* Empty state */}
      {watchlist && watchlist.length === 0 && (
        <div className="text-center py-24">
          <Clock className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Watchlist is empty</h2>
          <p className="text-muted-foreground mb-6">
            Discover movies and add them to your watchlist!
          </p>
          <Button asChild>
            <Link href="/explore">Start Exploring</Link>
          </Button>
        </div>
      )}

      {/* Movie grid */}
      {filteredList && filteredList.length > 0 && (
        <MovieGrid>
          {filteredList.map((movie) => (
            <div key={movie._id} className="relative">
              <MovieCard
                tmdbId={movie.tmdbId}
                title={movie.title}
                posterPath={movie.posterPath}
                releaseYear={movie.releaseYear}
                isInWatchlist={true}
                onToggleFavorite={() => handleToggleFavorite(movie)}
                onToggleWatchlist={() => handleRemove(movie.tmdbId, movie.title)}
              />
              <Button
                size="sm"
                variant={movie.watched ? "secondary" : "default"}
                className="absolute bottom-20 left-1/2 -translate-x-1/2 z-10"
                onClick={() => handleToggleWatched(movie)}
              >
                {movie.watched ? (
                  <>
                    <Eye className="h-3 w-3 mr-1" />
                    Watched
                  </>
                ) : (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Mark Watched
                  </>
                )}
              </Button>
            </div>
          ))}
        </MovieGrid>
      )}

      {/* No results */}
      {searchQuery && filteredList?.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No movies match &quot;{searchQuery}&quot;
        </div>
      )}

      {/* Empty tab state */}
      {!searchQuery && currentList.length === 0 && watchlist.length > 0 && (
        <div className="text-center py-12 text-muted-foreground">
          {tab === "unwatched"
            ? "All caught up! No movies left to watch."
            : "No watched movies yet."}
        </div>
      )}
    </div>
  );
}
