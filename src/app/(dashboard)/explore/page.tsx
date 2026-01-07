"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useAction, useMutation, useQuery } from "convex/react";
import { Film, TrendingUp, Star } from "lucide-react";

import { api } from "../../../../convex/_generated/api";
import { MovieSearch } from "@/components/movie/movie-search";
import { DiscoveryContainer } from "@/components/discovery/discovery-container";
import { MovieCard } from "@/components/movie/movie-card";
import { MovieGrid } from "@/components/movie/movie-grid";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/components/providers/posthog-provider";

interface SelectedMovie {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  releaseYear: number;
  voteAverage?: number;
}

interface Movie {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  releaseYear: number;
  voteAverage: number;
  voteCount: number;
}

export default function ExplorePage() {
  const { user, isLoaded } = useUser();
  const { toast } = useToast();
  const [selectedMovie, setSelectedMovie] = useState<SelectedMovie | null>(null);
  const [popularMovies, setPopularMovies] = useState<Movie[]>([]);
  const [topRatedMovies, setTopRatedMovies] = useState<Movie[]>([]);
  const [isLoadingPopular, setIsLoadingPopular] = useState(true);
  const [isLoadingTopRated, setIsLoadingTopRated] = useState(true);

  // Actions
  const getPopularMovies = useAction(api.tmdb.getPopularMovies);
  const getTopRatedMovies = useAction(api.tmdb.getTopRatedMovies);

  // Ensure user exists in Convex
  const createUser = useMutation(api.users.createUser);
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

  // Fetch popular movies on mount (3 pages = 60 movies)
  useEffect(() => {
    async function fetchPopularMovies() {
      setIsLoadingPopular(true);
      try {
        const [page1, page2, page3] = await Promise.all([
          getPopularMovies({ page: 1 }),
          getPopularMovies({ page: 2 }),
          getPopularMovies({ page: 3 }),
        ]);
        const allMovies = [...page1.results, ...page2.results, ...page3.results];
        setPopularMovies(allMovies);
      } catch (error) {
        console.error("Error fetching popular movies:", error);
      } finally {
        setIsLoadingPopular(false);
      }
    }
    fetchPopularMovies();
  }, [getPopularMovies]);

  // Fetch top rated movies on mount (3 pages = 60 movies)
  useEffect(() => {
    async function fetchTopRatedMovies() {
      setIsLoadingTopRated(true);
      try {
        const [page1, page2, page3] = await Promise.all([
          getTopRatedMovies({ page: 1 }),
          getTopRatedMovies({ page: 2 }),
          getTopRatedMovies({ page: 3 }),
        ]);
        const allMovies = [...page1.results, ...page2.results, ...page3.results];
        setTopRatedMovies(allMovies);
      } catch (error) {
        console.error("Error fetching top rated movies:", error);
      } finally {
        setIsLoadingTopRated(false);
      }
    }
    fetchTopRatedMovies();
  }, [getTopRatedMovies]);

  const handleSelectMovie = (movie: SelectedMovie) => {
    setSelectedMovie(movie);
  };

  const handleBack = () => {
    setSelectedMovie(null);
  };

  const handleToggleFavorite = async (movie: Movie) => {
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

  const handleToggleWatchlist = async (movie: Movie) => {
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
          <div className="text-center py-8">
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

          {/* Popular & Top Rated Movies */}
          <div className="pt-8">
            <Tabs defaultValue="popular" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="popular" className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Popular Now
                </TabsTrigger>
                <TabsTrigger value="top-rated" className="flex items-center gap-2">
                  <Star className="h-4 w-4" />
                  Top Rated
                </TabsTrigger>
              </TabsList>

              <TabsContent value="popular">
                <p className="text-sm text-muted-foreground mb-4">
                  Click on any movie to discover more films from the same director or studio
                </p>
                {isLoadingPopular ? (
                  <MovieGrid>
                    {[...Array(20)].map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-60 w-full rounded-lg" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    ))}
                  </MovieGrid>
                ) : (
                  <MovieGrid>
                    {popularMovies.map((movie) => (
                      <MovieCard
                        key={movie.tmdbId}
                        tmdbId={movie.tmdbId}
                        title={movie.title}
                        posterPath={movie.posterPath}
                        releaseYear={movie.releaseYear}
                        voteAverage={movie.voteAverage}
                        isFavorite={favoriteIds.has(movie.tmdbId)}
                        isInWatchlist={watchlistIds.has(movie.tmdbId)}
                        onToggleFavorite={() => handleToggleFavorite(movie)}
                        onToggleWatchlist={() => handleToggleWatchlist(movie)}
                        onSelect={() =>
                          handleSelectMovie({
                            tmdbId: movie.tmdbId,
                            title: movie.title,
                            posterPath: movie.posterPath,
                            releaseYear: movie.releaseYear,
                            voteAverage: movie.voteAverage,
                          })
                        }
                      />
                    ))}
                  </MovieGrid>
                )}
              </TabsContent>

              <TabsContent value="top-rated">
                <p className="text-sm text-muted-foreground mb-4">
                  Click on any movie to discover more films from the same director or studio
                </p>
                {isLoadingTopRated ? (
                  <MovieGrid>
                    {[...Array(20)].map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-60 w-full rounded-lg" />
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    ))}
                  </MovieGrid>
                ) : (
                  <MovieGrid>
                    {topRatedMovies.map((movie) => (
                      <MovieCard
                        key={movie.tmdbId}
                        tmdbId={movie.tmdbId}
                        title={movie.title}
                        posterPath={movie.posterPath}
                        releaseYear={movie.releaseYear}
                        voteAverage={movie.voteAverage}
                        isFavorite={favoriteIds.has(movie.tmdbId)}
                        isInWatchlist={watchlistIds.has(movie.tmdbId)}
                        onToggleFavorite={() => handleToggleFavorite(movie)}
                        onToggleWatchlist={() => handleToggleWatchlist(movie)}
                        onSelect={() =>
                          handleSelectMovie({
                            tmdbId: movie.tmdbId,
                            title: movie.title,
                            posterPath: movie.posterPath,
                            releaseYear: movie.releaseYear,
                            voteAverage: movie.voteAverage,
                          })
                        }
                      />
                    ))}
                  </MovieGrid>
                )}
              </TabsContent>
            </Tabs>
          </div>
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
