import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getDiscoveryHistory = query({
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

export const getDiscoverySession = query({
  args: { sessionId: v.id("discoverySessions") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.sessionId);
  },
});

export const createDiscoverySession = mutation({
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
      userId: args.userId,
      seedMovieTmdbId: args.seedMovieTmdbId,
      seedMovieTitle: args.seedMovieTitle,
      seedMoviePosterPath: args.seedMoviePosterPath,
      mode: args.mode,
      directorId: args.directorId,
      directorName: args.directorName,
      studioId: args.studioId,
      studioName: args.studioName,
      recommendedMovieIds: args.recommendedMovieIds,
      createdAt: Date.now(),
    });
  },
});

export const deleteDiscoverySession = mutation({
  args: { sessionId: v.id("discoverySessions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.sessionId);
  },
});

export const clearDiscoveryHistory = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("discoverySessions")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }
  },
});
