"use node";

import { v } from "convex/values";
import { action, internalAction } from "./_generated/server";
import { api, internal } from "./_generated/api";

const TMDB_BASE_URL = "https://api.themoviedb.org/3";

// Type definitions for internal action returns
type MovieDetails = {
  tmdbId: number;
  title: string;
  originalTitle: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string;
  releaseYear: number;
  runtime: number;
  voteAverage: number;
  voteCount: number;
  genres: { id: number; name: string }[];
  directorId?: number;
  directorName?: string;
  productionCompanies: { id: number; name: string; logoPath: string | null }[];
};

type DirectorDetails = {
  id: number;
  name: string;
  profilePath: string | null;
  biography: string;
  birthday: string | null;
  placeOfBirth: string | null;
  filmography: {
    tmdbId: number;
    title: string;
    releaseYear: number;
    posterPath: string | null;
    voteAverage: number;
    voteCount: number;
    job: string;
  }[];
};

type StudioDetails = {
  id: number;
  name: string;
  logoPath: string | null;
  description: string;
  headquarters: string;
  homepage: string;
  filmography: {
    tmdbId: number;
    title: string;
    releaseYear: number;
    posterPath: string | null;
    voteAverage: number;
    voteCount: number;
  }[];
};
const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

async function tmdbFetch(endpoint: string, params: Record<string, string> = {}) {
  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    throw new Error("TMDB_API_KEY not configured");
  }

  const url = new URL(`${TMDB_BASE_URL}${endpoint}`);
  url.searchParams.set("api_key", apiKey);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

export const searchMovies = action({
  args: { query: v.string(), page: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const data = await tmdbFetch("/search/movie", {
      query: args.query,
      page: String(args.page ?? 1),
      include_adult: "false",
    });

    return {
      page: data.page,
      totalPages: data.total_pages,
      totalResults: data.total_results,
      results: data.results.map((movie: any) => ({
        tmdbId: movie.id,
        title: movie.title,
        originalTitle: movie.original_title,
        overview: movie.overview,
        posterPath: movie.poster_path,
        backdropPath: movie.backdrop_path,
        releaseDate: movie.release_date || "",
        releaseYear: movie.release_date
          ? new Date(movie.release_date).getFullYear()
          : 0,
        voteAverage: movie.vote_average,
        voteCount: movie.vote_count,
        genreIds: movie.genre_ids,
      })),
    };
  },
});

export const getMovieDetails = action({
  args: { tmdbId: v.number() },
  handler: async (ctx, args): Promise<MovieDetails> => {
    // Check cache first
    const cached = await ctx.runQuery(internal.cache.getMovieFromCache, {
      tmdbId: args.tmdbId,
    });

    if (cached) {
      return {
        tmdbId: cached.tmdbId,
        title: cached.title,
        originalTitle: cached.originalTitle || cached.title,
        overview: cached.overview || "",
        posterPath: cached.posterPath ?? null,
        backdropPath: cached.backdropPath ?? null,
        releaseDate: cached.releaseDate,
        releaseYear: cached.releaseYear,
        runtime: cached.runtime || 0,
        voteAverage: cached.voteAverage || 0,
        voteCount: cached.voteCount || 0,
        genres: cached.genres,
        directorId: cached.directorId,
        directorName: cached.directorName,
        productionCompanies: cached.productionCompanies.map((c) => ({
          ...c,
          logoPath: c.logoPath ?? null,
        })),
      };
    }

    // Fetch movie details from API
    const movie = await tmdbFetch(`/movie/${args.tmdbId}`);

    // Fetch credits to get director
    const credits = await tmdbFetch(`/movie/${args.tmdbId}/credits`);

    const director = credits.crew?.find(
      (person: any) => person.job === "Director"
    );

    const movieData = {
      tmdbId: movie.id,
      title: movie.title,
      originalTitle: movie.original_title,
      overview: movie.overview,
      posterPath: movie.poster_path,
      backdropPath: movie.backdrop_path,
      releaseDate: movie.release_date || "",
      releaseYear: movie.release_date
        ? new Date(movie.release_date).getFullYear()
        : 0,
      runtime: movie.runtime,
      voteAverage: movie.vote_average,
      voteCount: movie.vote_count,
      genres: movie.genres?.map((g: any) => ({ id: g.id, name: g.name })) || [],
      directorId: director?.id,
      directorName: director?.name,
      productionCompanies:
        movie.production_companies?.map((c: any) => ({
          id: c.id,
          name: c.name,
          logoPath: c.logo_path || undefined,
        })) || [],
    };

    // Save to cache
    await ctx.runMutation(internal.cache.saveMovieToCache, movieData);

    return movieData;
  },
});

export const getDirectorDetails = action({
  args: { personId: v.number() },
  handler: async (ctx, args): Promise<DirectorDetails> => {
    // Check cache first
    const cached = await ctx.runQuery(internal.cache.getDirectorFromCache, {
      personId: args.personId,
    });

    if (cached) {
      return {
        id: cached.tmdbPersonId,
        name: cached.name,
        profilePath: cached.profilePath ?? null,
        biography: cached.biography || "",
        birthday: cached.birthday ?? null,
        placeOfBirth: cached.placeOfBirth ?? null,
        filmography: cached.filmography.map((m) => ({
          ...m,
          posterPath: m.posterPath ?? null,
          voteAverage: m.voteAverage ?? 0,
          voteCount: m.voteCount ?? 0,
        })),
      };
    }

    // Fetch person details from API
    const person = await tmdbFetch(`/person/${args.personId}`);

    // Fetch movie credits
    const credits = await tmdbFetch(`/person/${args.personId}/movie_credits`);

    // Filter to only director credits
    const directorCredits = credits.crew?.filter(
      (credit: any) => credit.job === "Director"
    ) || [];

    const filmography = directorCredits.map((movie: any) => ({
      tmdbId: movie.id,
      title: movie.title,
      releaseYear: movie.release_date
        ? new Date(movie.release_date).getFullYear()
        : 0,
      posterPath: movie.poster_path || undefined,
      voteAverage: movie.vote_average,
      voteCount: movie.vote_count,
      job: movie.job,
    }));

    // Save to cache
    await ctx.runMutation(internal.cache.saveDirectorToCache, {
      tmdbPersonId: person.id,
      name: person.name,
      profilePath: person.profile_path || undefined,
      biography: person.biography || undefined,
      birthday: person.birthday || undefined,
      placeOfBirth: person.place_of_birth || undefined,
      filmography,
    });

    return {
      id: person.id,
      name: person.name,
      profilePath: person.profile_path,
      biography: person.biography,
      birthday: person.birthday,
      placeOfBirth: person.place_of_birth,
      filmography,
    };
  },
});

export const getStudioDetails = action({
  args: { companyId: v.number() },
  handler: async (ctx, args): Promise<StudioDetails> => {
    // Check cache first
    const cached = await ctx.runQuery(internal.cache.getStudioFromCache, {
      companyId: args.companyId,
    });

    if (cached) {
      return {
        id: cached.tmdbCompanyId,
        name: cached.name,
        logoPath: cached.logoPath ?? null,
        description: cached.description || "",
        headquarters: cached.headquarters || "",
        homepage: cached.homepage || "",
        filmography: cached.filmography.map((m) => ({
          ...m,
          posterPath: m.posterPath ?? null,
          voteAverage: m.voteAverage ?? 0,
          voteCount: m.voteCount ?? 0,
        })),
      };
    }

    // Fetch company details from API
    const company = await tmdbFetch(`/company/${args.companyId}`);

    // Fetch movies by company (paginated, get multiple pages)
    const allMovies: any[] = [];
    let page = 1;
    const maxPages = 5; // Limit to avoid too many API calls

    while (page <= maxPages) {
      const movies = await tmdbFetch("/discover/movie", {
        with_companies: String(args.companyId),
        sort_by: "vote_count.desc",
        page: String(page),
      });

      allMovies.push(...movies.results);

      if (page >= movies.total_pages) break;
      page++;
    }

    const filmography = allMovies.map((movie: any) => ({
      tmdbId: movie.id,
      title: movie.title,
      releaseYear: movie.release_date
        ? new Date(movie.release_date).getFullYear()
        : 0,
      posterPath: movie.poster_path || undefined,
      voteAverage: movie.vote_average,
      voteCount: movie.vote_count,
    }));

    // Save to cache
    await ctx.runMutation(internal.cache.saveStudioToCache, {
      tmdbCompanyId: company.id,
      name: company.name,
      logoPath: company.logo_path || undefined,
      description: company.description || undefined,
      headquarters: company.headquarters || undefined,
      homepage: company.homepage || undefined,
      filmography,
    });

    return {
      id: company.id,
      name: company.name,
      logoPath: company.logo_path,
      description: company.description,
      headquarters: company.headquarters,
      homepage: company.homepage,
      filmography,
    };
  },
});

// Scoring functions
function calculateYearProximityScore(seedYear: number, movieYear: number): number {
  const diff = Math.abs(seedYear - movieYear);
  if (diff === 0) return 30;
  if (diff === 1) return 27;
  if (diff === 2) return 24;
  if (diff === 3) return 21;
  if (diff === 4) return 18;
  if (diff === 5) return 15;
  if (diff <= 10) return 10;
  if (diff <= 15) return 5;
  return 2;
}

function calculateRatingScore(voteAverage: number): number {
  if (voteAverage >= 8.0) return 25;
  if (voteAverage >= 7.0) return 20;
  if (voteAverage >= 6.0) return 15;
  if (voteAverage >= 5.0) return 10;
  return 5;
}

function calculateGenreOverlapScore(
  seedGenreIds: number[],
  movieGenreIds: number[]
): number {
  const overlap = seedGenreIds.filter((g) => movieGenreIds.includes(g)).length;
  return Math.min(overlap * 10, 30);
}

function calculatePopularityScore(voteCount: number): number {
  return voteCount > 1000 ? 15 : 0;
}

export const discoverByDirector = action({
  args: { tmdbId: v.number(), userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    // Get movie details
    const movieDetails: MovieDetails = await ctx.runAction(api.tmdb.getMovieDetails, {
      tmdbId: args.tmdbId,
    });

    if (!movieDetails.directorId) {
      throw new Error("No director found for this movie");
    }

    // Get director details with filmography
    const director: DirectorDetails = await ctx.runAction(api.tmdb.getDirectorDetails, {
      personId: movieDetails.directorId,
    });

    // Filter out the seed movie and score remaining
    const recommendations = director.filmography
      .filter((movie: any) => movie.tmdbId !== args.tmdbId && movie.releaseYear > 0)
      .map((movie: any) => {
        const yearProximity = calculateYearProximityScore(
          movieDetails.releaseYear,
          movie.releaseYear
        );
        const ratingQuality = calculateRatingScore(movie.voteAverage || 0);
        const popularityBoost = calculatePopularityScore(movie.voteCount || 0);
        // Note: We don't have genre info for filmography movies, so genre overlap is 0
        const genreOverlap = 0;

        const score = yearProximity + ratingQuality + genreOverlap + popularityBoost;

        return {
          movie: {
            tmdbId: movie.tmdbId,
            title: movie.title,
            posterPath: movie.posterPath,
            releaseYear: movie.releaseYear,
            voteAverage: movie.voteAverage,
            voteCount: movie.voteCount,
          },
          score,
          scoreBreakdown: {
            yearProximity,
            ratingQuality,
            genreOverlap,
            popularityBoost,
          },
        };
      })
      .sort((a: any, b: any) => b.score - a.score);

    // Save discovery session if userId is provided
    if (args.userId) {
      await ctx.runMutation(internal.cache.saveDiscoverySession, {
        userId: args.userId,
        seedMovieTmdbId: movieDetails.tmdbId,
        seedMovieTitle: movieDetails.title,
        seedMoviePosterPath: movieDetails.posterPath || undefined,
        mode: "director",
        directorId: director.id,
        directorName: director.name,
        recommendedMovieIds: recommendations.map((r: any) => r.movie.tmdbId),
      });
    }

    return {
      seedMovie: movieDetails,
      director: {
        id: director.id,
        name: director.name,
        profilePath: director.profilePath,
        biography: director.biography,
        birthday: director.birthday,
        placeOfBirth: director.placeOfBirth,
        totalFilms: director.filmography.length,
      },
      recommendations,
    };
  },
});

export const discoverByStudio = action({
  args: { tmdbId: v.number(), userId: v.optional(v.id("users")) },
  handler: async (ctx, args) => {
    // Get movie details
    const movieDetails: MovieDetails = await ctx.runAction(api.tmdb.getMovieDetails, {
      tmdbId: args.tmdbId,
    });

    if (!movieDetails.productionCompanies?.length) {
      throw new Error("No production company found for this movie");
    }

    // Use the first (primary) production company
    const primaryCompany = movieDetails.productionCompanies[0];

    // Get studio details with filmography
    const studio: StudioDetails = await ctx.runAction(api.tmdb.getStudioDetails, {
      companyId: primaryCompany.id,
    });

    // Filter out the seed movie and score remaining
    const recommendations = studio.filmography
      .filter((movie: any) => movie.tmdbId !== args.tmdbId && movie.releaseYear > 0)
      .map((movie: any) => {
        const yearProximity = calculateYearProximityScore(
          movieDetails.releaseYear,
          movie.releaseYear
        );
        const ratingQuality = calculateRatingScore(movie.voteAverage || 0);
        const popularityBoost = calculatePopularityScore(movie.voteCount || 0);
        const genreOverlap = 0;

        const score = yearProximity + ratingQuality + genreOverlap + popularityBoost;

        return {
          movie: {
            tmdbId: movie.tmdbId,
            title: movie.title,
            posterPath: movie.posterPath,
            releaseYear: movie.releaseYear,
            voteAverage: movie.voteAverage,
            voteCount: movie.voteCount,
          },
          score,
          scoreBreakdown: {
            yearProximity,
            ratingQuality,
            genreOverlap,
            popularityBoost,
          },
        };
      })
      .sort((a: any, b: any) => b.score - a.score);

    // Save discovery session if userId is provided
    if (args.userId) {
      await ctx.runMutation(internal.cache.saveDiscoverySession, {
        userId: args.userId,
        seedMovieTmdbId: movieDetails.tmdbId,
        seedMovieTitle: movieDetails.title,
        seedMoviePosterPath: movieDetails.posterPath || undefined,
        mode: "studio",
        studioId: studio.id,
        studioName: studio.name,
        recommendedMovieIds: recommendations.map((r: any) => r.movie.tmdbId),
      });
    }

    return {
      seedMovie: movieDetails,
      studio: {
        id: studio.id,
        name: studio.name,
        logoPath: studio.logoPath,
        description: studio.description,
        headquarters: studio.headquarters,
        totalFilms: studio.filmography.length,
      },
      recommendations,
    };
  },
});
