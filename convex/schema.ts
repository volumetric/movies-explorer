import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // User profile (synced from Clerk)
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    name: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
    isPremium: v.boolean(),
    stripeCustomerId: v.optional(v.string()),
    stripeSubscriptionId: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_stripe_customer_id", ["stripeCustomerId"]),

  // User's favorite movies
  favoriteMovies: defineTable({
    userId: v.id("users"),
    tmdbId: v.number(),
    title: v.string(),
    posterPath: v.optional(v.string()),
    releaseYear: v.number(),
    addedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_tmdb", ["userId", "tmdbId"]),

  // Cached movie details from TMDB
  movieCache: defineTable({
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
    genres: v.array(
      v.object({
        id: v.number(),
        name: v.string(),
      })
    ),
    // Director info
    directorId: v.optional(v.number()),
    directorName: v.optional(v.string()),
    // Production companies (studios)
    productionCompanies: v.array(
      v.object({
        id: v.number(),
        name: v.string(),
        logoPath: v.optional(v.string()),
      })
    ),
    // Cache metadata
    cachedAt: v.number(),
    lastAccessedAt: v.number(),
  })
    .index("by_tmdb_id", ["tmdbId"])
    .index("by_director", ["directorId"])
    .index("by_release_year", ["releaseYear"]),

  // Cached director filmographies
  directorCache: defineTable({
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
    cachedAt: v.number(),
  }).index("by_person_id", ["tmdbPersonId"]),

  // Cached studio filmographies
  studioCache: defineTable({
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
    cachedAt: v.number(),
  }).index("by_company_id", ["tmdbCompanyId"]),

  // User's watchlist
  watchlist: defineTable({
    userId: v.id("users"),
    tmdbId: v.number(),
    title: v.string(),
    posterPath: v.optional(v.string()),
    releaseYear: v.number(),
    addedAt: v.number(),
    watched: v.boolean(),
    watchedAt: v.optional(v.number()),
    priority: v.optional(v.number()),
    notes: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_tmdb", ["userId", "tmdbId"])
    .index("by_user_and_watched", ["userId", "watched"]),

  // Discovery sessions (for tracking exploration history)
  discoverySessions: defineTable({
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
    createdAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_created", ["userId", "createdAt"]),
});
