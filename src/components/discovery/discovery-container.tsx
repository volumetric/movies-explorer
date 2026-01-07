"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useAction, useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { ArrowLeft, Heart, Plus, Check, Star, Loader2 } from "lucide-react";

import { api } from "../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { getImageUrl } from "@/lib/utils";
import { trackEvent } from "@/components/providers/posthog-provider";

import { DiscoveryToggle, DiscoveryMode } from "./discovery-toggle";
import { DirectorInfo } from "./director-info";
import { StudioInfo } from "./studio-info";
import { MovieCard } from "@/components/movie/movie-card";
import { MovieGrid } from "@/components/movie/movie-grid";

interface SelectedMovie {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  releaseYear: number;
  voteAverage?: number;
}

interface DiscoveryContainerProps {
  selectedMovie: SelectedMovie;
  onBack: () => void;
}

export function DiscoveryContainer({
  selectedMovie,
  onBack,
}: DiscoveryContainerProps) {
  const { user } = useUser();
  const { toast } = useToast();
  const [mode, setMode] = useState<DiscoveryMode>("director");
  const [directorData, setDirectorData] = useState<any>(null);
  const [studioData, setStudioData] = useState<any>(null);
  const [isLoadingDirector, setIsLoadingDirector] = useState(false);
  const [isLoadingStudio, setIsLoadingStudio] = useState(false);

  const discoverByDirector = useAction(api.tmdb.discoverByDirector);
  const discoverByStudio = useAction(api.tmdb.discoverByStudio);

  // Get user from Convex
  const convexUser = useQuery(
    api.users.getUser,
    user?.id ? { clerkId: user.id } : "skip"
  );

  // Query favorites and watchlist
  const favorites = useQuery(
    api.favorites.getFavorites,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );
  const watchlist = useQuery(
    api.watchlist.getWatchlist,
    convexUser?._id ? { userId: convexUser._id } : "skip"
  );

  // Create sets for quick lookup
  const favoriteIds = new Set(favorites?.map((f) => f.tmdbId) || []);
  const watchlistIds = new Set(watchlist?.map((w) => w.tmdbId) || []);

  // Mutations
  const toggleFavorite = useMutation(api.favorites.toggleFavorite);
  const toggleWatchlist = useMutation(api.watchlist.toggleWatchlist);

  // Fetch director data
  useEffect(() => {
    async function fetchDirector() {
      setIsLoadingDirector(true);
      try {
        const data = await discoverByDirector({
          tmdbId: selectedMovie.tmdbId,
          userId: convexUser?._id,
        });
        setDirectorData(data);
        trackEvent.discoveryStarted(selectedMovie.tmdbId, selectedMovie.title, "director");
      } catch (error) {
        console.error("Error fetching director data:", error);
        toast({
          title: "Error",
          description: "Failed to load director information",
          variant: "destructive",
        });
      } finally {
        setIsLoadingDirector(false);
      }
    }
    fetchDirector();
  }, [selectedMovie.tmdbId, discoverByDirector, toast, selectedMovie.title, convexUser?._id]);

  // Fetch studio data only when switching to studio mode
  useEffect(() => {
    if (mode === "studio" && !studioData && !isLoadingStudio) {
      const fetchStudio = async () => {
        setIsLoadingStudio(true);
        try {
          const data = await discoverByStudio({
            tmdbId: selectedMovie.tmdbId,
            userId: convexUser?._id,
          });
          setStudioData(data);
          trackEvent.discoveryStarted(selectedMovie.tmdbId, selectedMovie.title, "studio");
        } catch (error) {
          console.error("Error fetching studio data:", error);
          toast({
            title: "Error",
            description: "Failed to load studio information",
            variant: "destructive",
          });
        } finally {
          setIsLoadingStudio(false);
        }
      };
      fetchStudio();
    }
  }, [mode, studioData, isLoadingStudio, selectedMovie.tmdbId, discoverByStudio, toast, selectedMovie.title, convexUser?._id]);

  const handleModeChange = (newMode: DiscoveryMode) => {
    setMode(newMode);
    trackEvent.discoveryModeToggled(newMode);
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
      if (result.added) {
        trackEvent.movieAddedToFavorites(movie.tmdbId, movie.title);
        toast({ title: "Added to favorites" });
      } else {
        toast({ title: "Removed from favorites" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update favorites", variant: "destructive" });
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
      if (result.added) {
        trackEvent.movieAddedToWatchlist(movie.tmdbId, movie.title);
        toast({ title: "Added to watchlist" });
      } else {
        toast({ title: "Removed from watchlist" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update watchlist", variant: "destructive" });
    }
  };

  const currentData = mode === "director" ? directorData : studioData;
  const isLoading = mode === "director" ? isLoadingDirector : isLoadingStudio;

  return (
    <div className="space-y-6">
      {/* Back button and seed movie */}
      <div className="flex items-start gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>

        <Card className="flex-1">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative h-24 w-16 flex-shrink-0 overflow-hidden rounded-lg">
                <Image
                  src={getImageUrl(selectedMovie.posterPath, "w185")}
                  alt={selectedMovie.title}
                  fill
                  className="object-cover"
                  sizes="64px"
                />
              </div>
              <div>
                <h2 className="text-xl font-semibold">{selectedMovie.title}</h2>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{selectedMovie.releaseYear}</span>
                  {selectedMovie.voteAverage && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                        {selectedMovie.voteAverage.toFixed(1)}
                      </span>
                    </>
                  )}
                </div>
                {directorData?.seedMovie?.directorName && (
                  <p className="text-sm text-muted-foreground">
                    Directed by {directorData.seedMovie.directorName}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Discovery Toggle */}
      <div>
        <h3 className="text-lg font-semibold mb-3">Discover Similar Movies</h3>
        <DiscoveryToggle
          mode={mode}
          onModeChange={handleModeChange}
          directorName={directorData?.director?.name}
          studioName={studioData?.studio?.name}
        />
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-60 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Director/Studio Info */}
      {!isLoading && currentData && (
        <>
          {mode === "director" && directorData?.director && (
            <DirectorInfo {...directorData.director} />
          )}
          {mode === "studio" && studioData?.studio && (
            <StudioInfo {...studioData.studio} />
          )}

          {/* Recommendations */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                Recommended Films
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  (sorted by relevance)
                </span>
              </h3>
              <Badge variant="secondary">
                {currentData.recommendations?.length || 0} movies
              </Badge>
            </div>

            {currentData.recommendations?.length > 0 ? (
              <MovieGrid>
                {currentData.recommendations.map((rec: any) => (
                  <MovieCard
                    key={rec.movie.tmdbId}
                    tmdbId={rec.movie.tmdbId}
                    title={rec.movie.title}
                    posterPath={rec.movie.posterPath}
                    releaseYear={rec.movie.releaseYear}
                    voteAverage={rec.movie.voteAverage}
                    score={rec.score}
                    scoreBreakdown={rec.scoreBreakdown}
                    showScore={true}
                    isFavorite={favoriteIds.has(rec.movie.tmdbId)}
                    isInWatchlist={watchlistIds.has(rec.movie.tmdbId)}
                    onToggleFavorite={() => handleToggleFavorite(rec.movie)}
                    onToggleWatchlist={() => handleToggleWatchlist(rec.movie)}
                  />
                ))}
              </MovieGrid>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No recommendations found
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
