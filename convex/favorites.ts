import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getFavorites = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("favoriteMovies")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const isFavorite = query({
  args: { userId: v.id("users"), tmdbId: v.number() },
  handler: async (ctx, args) => {
    const favorite = await ctx.db
      .query("favoriteMovies")
      .withIndex("by_user_and_tmdb", (q) =>
        q.eq("userId", args.userId).eq("tmdbId", args.tmdbId)
      )
      .first();
    return !!favorite;
  },
});

export const addFavorite = mutation({
  args: {
    userId: v.id("users"),
    tmdbId: v.number(),
    title: v.string(),
    posterPath: v.optional(v.string()),
    releaseYear: v.number(),
  },
  handler: async (ctx, args) => {
    // Check if already a favorite
    const existing = await ctx.db
      .query("favoriteMovies")
      .withIndex("by_user_and_tmdb", (q) =>
        q.eq("userId", args.userId).eq("tmdbId", args.tmdbId)
      )
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("favoriteMovies", {
      userId: args.userId,
      tmdbId: args.tmdbId,
      title: args.title,
      posterPath: args.posterPath,
      releaseYear: args.releaseYear,
      addedAt: Date.now(),
    });
  },
});

export const removeFavorite = mutation({
  args: { userId: v.id("users"), tmdbId: v.number() },
  handler: async (ctx, args) => {
    const favorite = await ctx.db
      .query("favoriteMovies")
      .withIndex("by_user_and_tmdb", (q) =>
        q.eq("userId", args.userId).eq("tmdbId", args.tmdbId)
      )
      .first();

    if (favorite) {
      await ctx.db.delete(favorite._id);
    }
  },
});

export const toggleFavorite = mutation({
  args: {
    userId: v.id("users"),
    tmdbId: v.number(),
    title: v.string(),
    posterPath: v.optional(v.string()),
    releaseYear: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("favoriteMovies")
      .withIndex("by_user_and_tmdb", (q) =>
        q.eq("userId", args.userId).eq("tmdbId", args.tmdbId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { added: false };
    } else {
      await ctx.db.insert("favoriteMovies", {
        userId: args.userId,
        tmdbId: args.tmdbId,
        title: args.title,
        posterPath: args.posterPath,
        releaseYear: args.releaseYear,
        addedAt: Date.now(),
      });
      return { added: true };
    }
  },
});
