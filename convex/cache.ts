import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery } from "./_generated/server";

const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Movie Cache
export const getMovieFromCache = internalQuery({
  args: { tmdbId: v.number() },
  handler: async (ctx, args) => {
    const cached = await ctx.db
      .query("movieCache")
      .withIndex("by_tmdb_id", (q) => q.eq("tmdbId", args.tmdbId))
      .first();

    if (!cached) return null;

    // Check if cache is stale
    if (Date.now() - cached.cachedAt > CACHE_DURATION_MS) {
      return null;
    }

    return cached;
  },
});

export const saveMovieToCache = internalMutation({
  args: {
    tmdbId: v.number(),
    title: v.string(),
    originalTitle: v.optional(v.string()),
    overview: v.optional(v.string()),
    posterPath: v.optional(v.string()),
    backdropPath: v.optional(v.string()),
    releaseDate: v.string(),
    releaseYear: v.number(),
    runtime: v.optional(v.number()),
    voteAverage: v.optional(v.number()),
    voteCount: v.optional(v.number()),
    genres: v.array(v.object({ id: v.number(), name: v.string() })),
    directorId: v.optional(v.number()),
    directorName: v.optional(v.string()),
    productionCompanies: v.array(
      v.object({
        id: v.number(),
        name: v.string(),
        logoPath: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Check if already exists
    const existing = await ctx.db
      .query("movieCache")
      .withIndex("by_tmdb_id", (q) => q.eq("tmdbId", args.tmdbId))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        cachedAt: now,
        lastAccessedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("movieCache", {
      ...args,
      cachedAt: now,
      lastAccessedAt: now,
    });
  },
});

// Director Cache
export const getDirectorFromCache = internalQuery({
  args: { personId: v.number() },
  handler: async (ctx, args) => {
    const cached = await ctx.db
      .query("directorCache")
      .withIndex("by_person_id", (q) => q.eq("tmdbPersonId", args.personId))
      .first();

    if (!cached) return null;

    if (Date.now() - cached.cachedAt > CACHE_DURATION_MS) {
      return null;
    }

    return cached;
  },
});

export const saveDirectorToCache = internalMutation({
  args: {
    tmdbPersonId: v.number(),
    name: v.string(),
    profilePath: v.optional(v.string()),
    biography: v.optional(v.string()),
    birthday: v.optional(v.string()),
    placeOfBirth: v.optional(v.string()),
    filmography: v.array(
      v.object({
        tmdbId: v.number(),
        title: v.string(),
        releaseYear: v.number(),
        posterPath: v.optional(v.string()),
        voteAverage: v.optional(v.number()),
        voteCount: v.optional(v.number()),
        job: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("directorCache")
      .withIndex("by_person_id", (q) => q.eq("tmdbPersonId", args.tmdbPersonId))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        cachedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("directorCache", {
      ...args,
      cachedAt: now,
    });
  },
});

// Studio Cache
export const getStudioFromCache = internalQuery({
  args: { companyId: v.number() },
  handler: async (ctx, args) => {
    const cached = await ctx.db
      .query("studioCache")
      .withIndex("by_company_id", (q) => q.eq("tmdbCompanyId", args.companyId))
      .first();

    if (!cached) return null;

    if (Date.now() - cached.cachedAt > CACHE_DURATION_MS) {
      return null;
    }

    return cached;
  },
});

export const saveStudioToCache = internalMutation({
  args: {
    tmdbCompanyId: v.number(),
    name: v.string(),
    logoPath: v.optional(v.string()),
    description: v.optional(v.string()),
    headquarters: v.optional(v.string()),
    homepage: v.optional(v.string()),
    filmography: v.array(
      v.object({
        tmdbId: v.number(),
        title: v.string(),
        releaseYear: v.number(),
        posterPath: v.optional(v.string()),
        voteAverage: v.optional(v.number()),
        voteCount: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("studioCache")
      .withIndex("by_company_id", (q) => q.eq("tmdbCompanyId", args.tmdbCompanyId))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        ...args,
        cachedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("studioCache", {
      ...args,
      cachedAt: now,
    });
  },
});

// Discovery Sessions
export const saveDiscoverySession = internalMutation({
  args: {
    userId: v.id("users"),
    seedMovieTmdbId: v.number(),
    seedMovieTitle: v.string(),
    seedMoviePosterPath: v.optional(v.string()),
    mode: v.union(v.literal("director"), v.literal("studio")),
    directorId: v.optional(v.number()),
    directorName: v.optional(v.string()),
    studioId: v.optional(v.number()),
    studioName: v.optional(v.string()),
    recommendedMovieIds: v.array(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("discoverySessions", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const getDiscoverySessions = query({
  args: { userId: v.id("users"), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("discoverySessions")
      .withIndex("by_user_and_created", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(args.limit ?? 20);

    return sessions;
  },
});
