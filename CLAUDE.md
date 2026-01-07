# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
pnpm dev          # Start Next.js dev server (localhost:3000)
pnpm convex dev   # Start Convex dev server (run in separate terminal)
pnpm build        # Build for production
pnpm lint         # Run ESLint
pnpm convex deploy  # Deploy Convex to production
```

**Important**: Both `pnpm dev` and `pnpm convex dev` must run simultaneously during development.

## Architecture Overview

This is a movie discovery app that recommends films based on directors and studios. Users search for a movie, then explore other works by the same director or production studio.

### Stack
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, ShadCN UI
- **Backend**: Convex (serverless database + functions)
- **Auth**: Clerk with Google OAuth, synced to Convex via webhooks
- **External API**: TMDB for movie data

### Data Flow

1. **Authentication**: Clerk handles auth → webhook at `/api/webhooks/clerk` syncs user to Convex `users` table
2. **Movie Search**: Frontend calls `api.tmdb.searchMovies` action → fetches from TMDB API
3. **Discovery**: User selects movie → `discoverByDirector` or `discoverByStudio` actions fetch filmographies from TMDB and score recommendations

### Convex Backend (`convex/`)

Files marked with `"use node"` are Node.js actions that can make external API calls. Regular queries/mutations run in Convex's JavaScript runtime.

- `schema.ts` - Database schema with 7 tables: users, favoriteMovies, movieCache, directorCache, studioCache, watchlist, discoverySessions
- `tmdb.ts` - TMDB API integration (Node.js actions for search, movie details, director/studio discovery)
- `users.ts`, `favorites.ts`, `watchlist.ts`, `discovery.ts` - CRUD operations

### Scoring Algorithm

Recommendations are ranked by a composite score (max 100 points):
- Year Proximity: 30 pts (closer to seed movie's release year = higher)
- Rating Quality: 25 pts (based on TMDB vote average)
- Genre Overlap: 30 pts (10 pts per matching genre, max 3)
- Popularity Boost: 15 pts (if vote count > 1000)

### Frontend Structure

- `src/app/(auth)/` - Sign-in/sign-up pages (Clerk components)
- `src/app/(dashboard)/` - Protected pages: explore, favorites, watchlist, history, settings
- `src/components/providers/` - ConvexClientProvider wraps app with Clerk auth integration
- `src/components/ui/` - ShadCN UI primitives

### Environment Variables

Required:
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET`
- `NEXT_PUBLIC_CONVEX_URL`
- `TMDB_API_KEY`

Optional: Stripe, PostHog, UploadThing credentials
