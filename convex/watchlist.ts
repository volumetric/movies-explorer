import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getWatchlist = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("watchlist")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
  },
});

export const getUnwatched = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("watchlist")
      .withIndex("by_user_and_watched", (q) =>
        q.eq("userId", args.userId).eq("watched", false)
      )
      .order("desc")
      .collect();
  },
});

export const getWatched = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("watchlist")
      .withIndex("by_user_and_watched", (q) =>
        q.eq("userId", args.userId).eq("watched", true)
      )
      .order("desc")
      .collect();
  },
});

export const isInWatchlist = query({
  args: { userId: v.id("users"), tmdbId: v.number() },
  handler: async (ctx, args) => {
    const item = await ctx.db
      .query("watchlist")
      .withIndex("by_user_and_tmdb", (q) =>
        q.eq("userId", args.userId).eq("tmdbId", args.tmdbId)
      )
      .first();
    return !!item;
  },
});

export const addToWatchlist = mutation({
  args: {
    userId: v.id("users"),
    tmdbId: v.number(),
    title: v.string(),
    posterPath: v.optional(v.string()),
    releaseYear: v.number(),
    priority: v.optional(v.number()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if already in watchlist
    const existing = await ctx.db
      .query("watchlist")
      .withIndex("by_user_and_tmdb", (q) =>
        q.eq("userId", args.userId).eq("tmdbId", args.tmdbId)
      )
      .first();

    if (existing) {
      return existing._id;
    }

    return await ctx.db.insert("watchlist", {
      userId: args.userId,
      tmdbId: args.tmdbId,
      title: args.title,
      posterPath: args.posterPath,
      releaseYear: args.releaseYear,
      addedAt: Date.now(),
      watched: false,
      priority: args.priority,
      notes: args.notes,
    });
  },
});

export const removeFromWatchlist = mutation({
  args: { userId: v.id("users"), tmdbId: v.number() },
  handler: async (ctx, args) => {
    const item = await ctx.db
      .query("watchlist")
      .withIndex("by_user_and_tmdb", (q) =>
        q.eq("userId", args.userId).eq("tmdbId", args.tmdbId)
      )
      .first();

    if (item) {
      await ctx.db.delete(item._id);
    }
  },
});

export const toggleWatchlist = mutation({
  args: {
    userId: v.id("users"),
    tmdbId: v.number(),
    title: v.string(),
    posterPath: v.optional(v.string()),
    releaseYear: v.number(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("watchlist")
      .withIndex("by_user_and_tmdb", (q) =>
        q.eq("userId", args.userId).eq("tmdbId", args.tmdbId)
      )
      .first();

    if (existing) {
      await ctx.db.delete(existing._id);
      return { added: false };
    } else {
      await ctx.db.insert("watchlist", {
        userId: args.userId,
        tmdbId: args.tmdbId,
        title: args.title,
        posterPath: args.posterPath,
        releaseYear: args.releaseYear,
        addedAt: Date.now(),
        watched: false,
      });
      return { added: true };
    }
  },
});

export const markAsWatched = mutation({
  args: { userId: v.id("users"), tmdbId: v.number() },
  handler: async (ctx, args) => {
    const item = await ctx.db
      .query("watchlist")
      .withIndex("by_user_and_tmdb", (q) =>
        q.eq("userId", args.userId).eq("tmdbId", args.tmdbId)
      )
      .first();

    if (item) {
      await ctx.db.patch(item._id, {
        watched: true,
        watchedAt: Date.now(),
      });
    }
  },
});

export const markAsUnwatched = mutation({
  args: { userId: v.id("users"), tmdbId: v.number() },
  handler: async (ctx, args) => {
    const item = await ctx.db
      .query("watchlist")
      .withIndex("by_user_and_tmdb", (q) =>
        q.eq("userId", args.userId).eq("tmdbId", args.tmdbId)
      )
      .first();

    if (item) {
      await ctx.db.patch(item._id, {
        watched: false,
        watchedAt: undefined,
      });
    }
  },
});

export const updateNotes = mutation({
  args: {
    userId: v.id("users"),
    tmdbId: v.number(),
    notes: v.optional(v.string()),
    priority: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const item = await ctx.db
      .query("watchlist")
      .withIndex("by_user_and_tmdb", (q) =>
        q.eq("userId", args.userId).eq("tmdbId", args.tmdbId)
      )
      .first();

    if (item) {
      await ctx.db.patch(item._id, {
        notes: args.notes,
        priority: args.priority,
      });
    }
  },
});
