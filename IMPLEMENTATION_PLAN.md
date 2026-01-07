# Movie Explorer App - Implementation Plan

## Project Overview

**Movie Explorer** is a Next.js application that helps users discover movies by analyzing their favorite films. When a user enters a movie they love, the app finds the director and studio, then recommends other movies from the same creative team—especially films made around the same time period when the director/studio was in a similar creative phase.

---

## Tech Stack Summary

| Layer | Technology |
|-------|------------|
| **Frontend Framework** | Next.js 14+ (App Router, React 18) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS + ShadCN UI |
| **Database** | Convex |
| **API Layer** | Convex Functions (queries, mutations, actions) |
| **Authentication** | Clerk |
| **Package Manager** | pnpm |
| **Backend Hosting** | Vercel |
| **Database Hosting** | Convex Cloud |
| **Analytics** | PostHog |
| **Bot Protection** | Vercel Bot Protection (Firewall) |
| **Payments** | Stripe (via Clerk Billing or direct integration) |
| **File Upload** | UploadThing |
| **Movie Data Source** | TMDB API (The Movie Database) |

---

## Phase 1: Project Setup & Foundation

### 1.1 Initialize Next.js Project
```bash
pnpm create next-app@latest movies-explorer --typescript --tailwind --eslint --app --src-dir
```

**Tasks:**
- [ ] Create Next.js 14 project with App Router
- [ ] Configure TypeScript strict mode
- [ ] Set up path aliases (`@/` for src)
- [ ] Configure ESLint + Prettier
- [ ] Add `.env.local` and `.env.example` files

### 1.2 Install Core Dependencies
```bash
# UI & Styling
pnpm add tailwindcss-animate class-variance-authority clsx tailwind-merge lucide-react

# ShadCN UI (via CLI)
pnpm dlx shadcn@latest init

# Convex
pnpm add convex

# Clerk
pnpm add @clerk/nextjs

# Utilities
pnpm add date-fns zod
```

### 1.3 Configure ShadCN UI
**Tasks:**
- [ ] Initialize ShadCN with `pnpm dlx shadcn@latest init`
- [ ] Choose theme (New York style recommended)
- [ ] Install essential components: Button, Card, Input, Dialog, Dropdown, Avatar, Skeleton, Toast, Command (for search)

### 1.4 Set Up Convex
**Tasks:**
- [ ] Run `pnpm convex dev` to initialize
- [ ] Create `convex/` directory with schema
- [ ] Configure Convex provider in app layout
- [ ] Set up environment variables for Convex deployment

### 1.5 Set Up Clerk Authentication
**Tasks:**
- [ ] Create Clerk application at clerk.com
- [ ] Configure OAuth providers (Google, GitHub)
- [ ] Add Clerk environment variables
- [ ] Wrap app with `ClerkProvider`
- [ ] Create middleware for protected routes
- [ ] Set up Clerk + Convex integration (JWT templates)

---

## Phase 2: Database Schema Design (Convex)

### 2.1 Core Schema (`convex/schema.ts`)

```typescript
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
    createdAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),

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
    .index("by_tmdb_id", ["tmdbId"]),

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
    genres: v.array(v.object({
      id: v.number(),
      name: v.string(),
    })),
    // Director info
    directorId: v.optional(v.number()),
    directorName: v.optional(v.string()),
    // Production companies (studios)
    productionCompanies: v.array(v.object({
      id: v.number(),
      name: v.string(),
      logoPath: v.optional(v.string()),
    })),
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
    filmography: v.array(v.object({
      tmdbId: v.number(),
      title: v.string(),
      releaseYear: v.number(),
      posterPath: v.optional(v.string()),
      job: v.string(), // "Director", "Writer", etc.
    })),
    cachedAt: v.number(),
  }).index("by_person_id", ["tmdbPersonId"]),

  // Cached studio filmographies
  studioCache: defineTable({
    tmdbCompanyId: v.number(),
    name: v.string(),
    logoPath: v.optional(v.string()),
    description: v.optional(v.string()),
    headquarters: v.optional(v.string()),
    filmography: v.array(v.object({
      tmdbId: v.number(),
      title: v.string(),
      releaseYear: v.number(),
      posterPath: v.optional(v.string()),
    })),
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
    priority: v.optional(v.number()), // 1-5 priority
    notes: v.optional(v.string()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_movie", ["userId", "tmdbId"]),

  // Discovery sessions (for tracking exploration history)
  discoverySessions: defineTable({
    userId: v.id("users"),
    seedMovieTmdbId: v.number(),
    seedMovieTitle: v.string(),
    exploredDirectors: v.array(v.number()),
    exploredStudios: v.array(v.number()),
    recommendedMovies: v.array(v.number()),
    createdAt: v.number(),
  }).index("by_user", ["userId"]),
});
```

---

## Phase 3: Movie Database Integration (TMDB API)

### 3.1 TMDB API Setup
**Tasks:**
- [ ] Register at themoviedb.org for API key
- [ ] Store API key in environment variables
- [ ] Create TMDB API client utility

### 3.2 Convex Actions for TMDB Integration

**File: `convex/tmdb.ts`**

Create Convex actions (not queries/mutations) since they need external HTTP calls:

```typescript
// Actions to implement:
- searchMovies(query: string) // Search TMDB for movies
- getMovieDetails(tmdbId: number) // Get full movie details + credits
- getDirectorFilmography(personId: number) // Get director's movies
- getStudioFilmography(companyId: number) // Get studio's movies

// SEPARATE discovery functions (do not mix director and studio):
- discoverByDirector(tmdbId: number, yearRange: number) // Director-based discovery
- discoverByStudio(tmdbId: number, yearRange: number)   // Studio-based discovery
```

### 3.3 Caching Strategy
**Tasks:**
- [ ] Cache movie details for 7 days
- [ ] Cache director/studio filmographies for 7 days
- [ ] Implement cache invalidation on access
- [ ] Use Convex scheduled functions for cache cleanup

### 3.4 Discovery Algorithm (Separate Paths)

**IMPORTANT**: Director and Studio recommendations are kept completely separate. Users choose which view they want to see via a toggle in the UI.

#### 3.4.1 Director-Based Discovery (`discoverByDirector`)

```typescript
// Flow for "By the same Director" recommendations:
1. User enters favorite movie
2. Fetch movie details from TMDB (or cache)
3. Extract director ID from credits
4. Fetch director's complete filmography
5. Filter to only movies where this person was DIRECTOR
6. Exclude the seed movie from results
7. Return ALL movies (no year filtering) - score and rank by:
   - Year proximity: +30 points max (rewards movies closer to seed movie's release)
     • Same year: +30 points
     • ±1 year: +27 points
     • ±2 years: +24 points
     • ±3 years: +21 points
     • ±4 years: +18 points
     • ±5 years: +15 points
     • ±6-10 years: +10 points
     • ±11-15 years: +5 points
     • >15 years: +2 points (still included, just lower priority)
   - Rating quality: +25 points max (based on TMDB vote_average)
     • 8.0+: +25 points
     • 7.0-7.9: +20 points
     • 6.0-6.9: +15 points
     • 5.0-5.9: +10 points
     • <5.0: +5 points
   - Genre overlap: +10 points per matching genre (max +30 points)
   - Popularity boost: +15 points if vote_count > 1000
8. Return ranked list with director info and explanation
   (All movies included - year proximity affects ranking, not filtering)
```

#### 3.4.2 Studio-Based Discovery (`discoverByStudio`)

```typescript
// Flow for "By the same Studio" recommendations:
1. User enters favorite movie
2. Fetch movie details from TMDB (or cache)
3. Extract primary production company (studio) ID
4. Fetch studio's complete filmography
5. Filter movies produced by this studio
6. Exclude the seed movie from results
7. Return ALL movies (no year filtering) - score and rank by:
   - Year proximity: +30 points max (rewards movies closer to seed movie's release)
     • Same year: +30 points
     • ±1 year: +27 points
     • ±2 years: +24 points
     • ±3 years: +21 points
     • ±4 years: +18 points
     • ±5 years: +15 points
     • ±6-10 years: +10 points
     • ±11-15 years: +5 points
     • >15 years: +2 points (still included, just lower priority)
   - Rating quality: +25 points max (based on TMDB vote_average)
     • 8.0+: +25 points
     • 7.0-7.9: +20 points
     • 6.0-6.9: +15 points
     • 5.0-5.9: +10 points
     • <5.0: +5 points
   - Genre overlap: +10 points per matching genre (max +30 points)
   - Popularity boost: +15 points if vote_count > 1000
8. Return ranked list with studio info and explanation
   (All movies included - year proximity affects ranking, not filtering)
```

#### 3.4.3 Response Format

```typescript
// Director recommendations response
interface DirectorRecommendations {
  seedMovie: MovieDetails;
  director: {
    id: number;
    name: string;
    profilePath: string | null;
    totalFilms: number;
  };
  recommendations: ScoredMovie[];
}

// Studio recommendations response
interface StudioRecommendations {
  seedMovie: MovieDetails;
  studio: {
    id: number;
    name: string;
    logoPath: string | null;
    totalFilms: number;
  };
  recommendations: ScoredMovie[];
}

interface ScoredMovie {
  movie: MovieDetails;
  score: number;
  scoreBreakdown: {
    yearProximity: number;
    ratingQuality: number;
    genreOverlap: number;
    popularityBoost: number;
  };
}
```

---

## Phase 4: Core Features Implementation

### 4.1 Page Structure (App Router)

```
src/app/
├── layout.tsx              # Root layout with providers
├── page.tsx                # Landing page / Hero
├── (auth)/
│   ├── sign-in/[[...sign-in]]/page.tsx
│   └── sign-up/[[...sign-up]]/page.tsx
├── (dashboard)/
│   ├── layout.tsx          # Dashboard layout with sidebar
│   ├── explore/page.tsx    # Main movie exploration
│   ├── favorites/page.tsx  # User's favorite movies
│   ├── watchlist/page.tsx  # Movies to watch
│   ├── history/page.tsx    # Discovery history
│   └── settings/page.tsx   # User settings
├── movie/
│   └── [id]/page.tsx       # Movie detail page
├── director/
│   └── [id]/page.tsx       # Director filmography page
├── studio/
│   └── [id]/page.tsx       # Studio filmography page
└── api/
    └── webhooks/
        ├── clerk/route.ts  # Clerk webhook for user sync
        └── stripe/route.ts # Stripe webhook for payments
```

### 4.2 Core Components

```
src/components/
├── ui/                     # ShadCN components
├── layout/
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   ├── Footer.tsx
│   └── MobileNav.tsx
├── movie/
│   ├── MovieCard.tsx       # Poster + basic info
│   ├── MovieGrid.tsx       # Grid of movie cards
│   ├── MovieSearch.tsx     # Search input with autocomplete
│   ├── MovieDetail.tsx     # Full movie info
│   └── SeedMovieCard.tsx   # Highlighted card for selected movie
├── discovery/
│   ├── DiscoveryContainer.tsx    # Main container managing toggle state
│   ├── DiscoveryToggle.tsx       # Toggle: "By Director" | "By Studio"
│   ├── DirectorRecommendations.tsx  # Director-based results view
│   ├── StudioRecommendations.tsx    # Studio-based results view
│   ├── RecommendationCard.tsx       # Movie card with score breakdown
│   └── TimelineView.tsx             # Visual timeline of movies
├── person/
│   ├── DirectorCard.tsx          # Director info header
│   └── DirectorFilmography.tsx
├── studio/
│   └── StudioCard.tsx            # Studio info header with logo
└── common/
    ├── LoadingSpinner.tsx
    ├── ErrorBoundary.tsx
    └── EmptyState.tsx
```

### 4.3 Key Features

#### Feature 1: Movie Search & Selection
- Autocomplete search using TMDB API
- Display movie poster, year, director preview
- One-click add to favorites

#### Feature 2: Discovery Engine (Separate Director/Studio Views)

**Toggle-Based Interface:**
- User selects a movie to explore
- Default view: **"By the same Director"** (selected by default)
- Alternative view: **"By the same Studio"**
- User can switch between views with a single click
- Each view shows completely independent recommendations

**"By the same Director" View:**
- Shows director's photo/name prominently
- Lists ALL movies directed by this person
- Ranked by scoring algorithm (year proximity, rating, genre, popularity)
- Movies from same era appear first, but older/newer films still visible

**"By the same Studio" View:**
- Shows studio logo/name prominently
- Lists ALL movies produced by this studio
- Ranked by same scoring algorithm
- Separate data set from director view

**UI Behavior:**
- Toggle persists during session (remembers user's preference)
- Both views available for same seed movie without re-searching
- Clear visual indication of which view is active

#### Feature 3: Favorites Management
- Add/remove favorite movies
- View all favorites in grid
- Quick discovery from any favorite (opens discovery with toggle)

#### Feature 4: Watchlist
- Add recommended movies to watchlist
- Mark as watched
- Add notes and priority
- Export to CSV/share

#### Feature 5: Discovery History
- Track past exploration sessions
- Revisit previous discoveries
- See patterns in preferences

---

## Phase 5: UI/UX Design

### 5.1 Design System

**Color Palette (Dark Theme Focus):**
```css
--background: 0 0% 3.9%;        /* Near black */
--foreground: 0 0% 98%;          /* Off white */
--card: 0 0% 7%;                 /* Card backgrounds */
--primary: 262 83% 58%;          /* Purple accent */
--secondary: 240 5% 15%;         /* Muted elements */
--accent: 47 100% 50%;           /* Gold for ratings */
```

**Typography:**
- Headings: Inter or Geist Sans
- Body: System UI stack
- Movie titles: Slightly larger, semi-bold

### 5.2 Key UI Patterns

**Movie Card Design:**
```
┌─────────────────┐
│                 │
│   [Poster]      │
│                 │
├─────────────────┤
│ Movie Title     │
│ 2019 · Director │
│ ★ 8.4           │
└─────────────────┘
```

**Discovery Page Layout with Toggle:**
```
┌────────────────────────────────────────────────────────────────┐
│  ← Back                                    [+ Add to Watchlist]│
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  ┌──────────┐  The Dark Knight (2008)                         │
│  │          │  Directed by Christopher Nolan                   │
│  │ [Poster] │  Warner Bros. Pictures                          │
│  │          │  ★ 9.0  ·  Action, Crime, Drama                 │
│  └──────────┘                                                  │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│  Discover Similar Movies                                       │
│                                                                │
│  ┌─────────────────────────────┬─────────────────────────────┐ │
│  │    ◉ By the same Director   │   ○ By the same Studio      │ │
│  └─────────────────────────────┴─────────────────────────────┘ │
│                                                                │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  👤 Christopher Nolan                                     │ │
│  │  12 films as director · Active 1998-present              │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Recommended Films (sorted by relevance)                       │
│                                                                │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │
│  │Inception│ │Prestige │ │ Batman  │ │Dunkirk  │ │Memento  │ │
│  │  2010   │ │  2006   │ │ Begins  │ │  2017   │ │  2000   │ │
│  │ ★ 8.8  │ │ ★ 8.5  │ │  2005   │ │ ★ 7.8  │ │ ★ 8.4  │ │
│  │ 87 pts │ │ 82 pts │ │ ★ 8.2  │ │ 71 pts │ │ 68 pts │ │
│  └─────────┘ └─────────┘ │ 79 pts │ └─────────┘ └─────────┘ │
│                          └─────────┘                          │
└────────────────────────────────────────────────────────────────┘
```

**Toggle Component (ShadCN Tabs style):**
```
Default State (Director selected):
┌────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────┬─────────────────────────────┐ │
│  │ ████ By the same Director ██│    By the same Studio       │ │
│  └─────────────────────────────┴─────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘

After clicking Studio:
┌────────────────────────────────────────────────────────────────┐
│  ┌─────────────────────────────┬─────────────────────────────┐ │
│  │    By the same Director     │ ████ By the same Studio ████│ │
│  └─────────────────────────────┴─────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘

- Active tab has filled background (primary color)
- Inactive tab has transparent/muted background
- Smooth transition animation between tabs
- Content below updates immediately on toggle
```

**Studio View (when toggled):**
```
│  ┌──────────────────────────────────────────────────────────┐ │
│  │  🏢 Warner Bros. Pictures                                 │ │
│  │  Est. 1923 · Headquarters: Burbank, CA                   │ │
│  │  2,500+ films produced                                   │ │
│  └──────────────────────────────────────────────────────────┘ │
│                                                                │
│  Recommended Films (sorted by relevance)                       │
│                                                                │
│  [Different set of movies produced by Warner Bros.]            │
```

**Discovery Timeline View:**
```
     1990        1995        2000        2005        2010
      │           │           │           │           │
      ○───────────●───────────○───────────○───────────○
   Movie A    [Selected]   Movie C     Movie D     Movie E
              Movie B

● = Selected movie (seed)
○ = Related movies from same director OR studio (depending on toggle)
```

### 5.3 Responsive Design
- Mobile-first approach
- Bottom navigation on mobile
- Side navigation on desktop
- Card grid: 2 cols mobile, 3 cols tablet, 4-6 cols desktop

---

## Phase 6: Authentication & User Management

### 6.1 Clerk Setup

**Tasks:**
- [ ] Configure Clerk application
- [ ] Enable Google OAuth only (no GitHub)
- [ ] Customize sign-in/sign-up UI to match theme
- [ ] Set up webhook for user sync to Convex

### 6.2 Clerk + Convex Integration

**Webhook Handler (`src/app/api/webhooks/clerk/route.ts`):**
```typescript
// Handle user.created, user.updated, user.deleted events
// Sync user data to Convex users table
```

**Convex Auth Integration:**
```typescript
// convex/auth.config.ts - Configure JWT verification
// Use Clerk's JWT template for Convex
```

### 6.3 Protected Routes

**Middleware (`src/middleware.ts`):**
```typescript
// Protect /explore, /favorites, /watchlist, /history, /settings
// Allow public access to /, /movie/*, /director/*, /studio/*
```

---

## Phase 7: Additional Integrations

### 7.1 PostHog Analytics

**Tasks:**
- [ ] Install `posthog-js` and `posthog-node`
- [ ] Create PostHog provider
- [ ] Track key events:
  - `movie_searched`
  - `discovery_started`
  - `movie_added_to_favorites`
  - `movie_added_to_watchlist`
  - `recommendation_clicked`
- [ ] Set up feature flags for A/B testing

### 7.2 Vercel Bot Protection

**Tasks:**
- [ ] Enable Vercel Firewall in project settings
- [ ] Configure rate limiting rules:
  - API routes: 100 req/min per IP
  - Search: 30 req/min per IP
- [ ] Add challenge page for suspicious traffic

### 7.3 Stripe Payments (Premium Features)

**Premium Tier Features:**
- Unlimited discovery sessions (free: 5/day)
- Advanced filters (genre, rating, decade)
- Export watchlist
- No ads
- Priority API access

**Tasks:**
- [ ] Create Stripe products/prices
- [ ] Set up Stripe checkout session
- [ ] Handle webhook events (subscription created/updated/canceled)
- [ ] Sync subscription status to Convex

### 7.4 UploadThing (File Uploads)

**Use Cases:**
- Custom profile pictures
- Watchlist cover images
- Future: User movie reviews with images

**Tasks:**
- [ ] Configure UploadThing
- [ ] Create upload endpoints
- [ ] Integrate with Convex for URL storage

---

## Phase 8: Performance & Optimization

### 8.1 Image Optimization
- Use Next.js `<Image>` for all movie posters
- Configure TMDB image domains in `next.config.js`
- Implement blur placeholders

### 8.2 Data Fetching Strategy
- Server Components for initial data
- Convex real-time subscriptions for user data
- Optimistic updates for favorites/watchlist

### 8.3 Caching Layers
```
Browser Cache (images) → Next.js Cache → Convex Cache → TMDB API
```

### 8.4 Bundle Optimization
- Dynamic imports for heavy components
- Route-based code splitting (automatic with App Router)
- Tree-shaking for icon libraries

---

## Phase 9: Testing Strategy

### 9.1 Unit Tests
- Test discovery algorithm logic
- Test TMDB API client
- Test utility functions

### 9.2 Integration Tests
- Test Convex queries/mutations
- Test API routes

### 9.3 E2E Tests (Playwright)
- User sign-up flow
- Movie search → discovery → add to watchlist
- Premium upgrade flow

---

## Phase 10: Deployment

### 10.1 Environment Setup

**Required Environment Variables:**
```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SECRET=

# Convex
NEXT_PUBLIC_CONVEX_URL=
CONVEX_DEPLOY_KEY=

# TMDB
TMDB_API_KEY=
TMDB_ACCESS_TOKEN=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# PostHog
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=

# UploadThing
UPLOADTHING_SECRET=
UPLOADTHING_APP_ID=
```

### 10.2 Deployment Steps

1. **Convex Deployment:**
   ```bash
   pnpm convex deploy
   ```

2. **Vercel Deployment:**
   - Connect GitHub repo
   - Configure environment variables
   - Enable Vercel Bot Protection
   - Set up preview deployments

3. **Domain Setup:**
   - Configure custom domain in Vercel
   - Set up SSL (automatic)
   - Configure Clerk redirect URLs

---

## Implementation Timeline (Phases, Not Dates)

| Phase | Description | Dependencies |
|-------|-------------|--------------|
| 1 | Project Setup | None |
| 2 | Database Schema | Phase 1 |
| 3 | TMDB Integration | Phase 2 |
| 4 | Core Features | Phase 3 |
| 5 | UI/UX Polish | Phase 4 |
| 6 | Auth & Users | Phase 1 |
| 7 | Integrations | Phase 4, 6 |
| 8 | Optimization | Phase 4, 5 |
| 9 | Testing | Phase 4 |
| 10 | Deployment | All |

---

## File Structure Overview

```
movies-explorer/
├── src/
│   ├── app/                    # Next.js App Router pages
│   ├── components/             # React components
│   ├── lib/                    # Utilities and helpers
│   │   ├── utils.ts            # General utilities
│   │   ├── tmdb.ts             # TMDB client (for client-side)
│   │   └── constants.ts        # App constants
│   ├── hooks/                  # Custom React hooks
│   └── types/                  # TypeScript types
├── convex/
│   ├── schema.ts               # Database schema
│   ├── users.ts                # User queries/mutations
│   ├── favorites.ts            # Favorites queries/mutations
│   ├── watchlist.ts            # Watchlist queries/mutations
│   ├── discovery.ts            # Discovery logic
│   ├── tmdb.ts                 # TMDB API actions
│   ├── _generated/             # Auto-generated Convex files
│   └── auth.config.ts          # Auth configuration
├── public/                     # Static assets
├── .env.local                  # Environment variables
├── .env.example                # Example env file
├── next.config.js              # Next.js configuration
├── tailwind.config.ts          # Tailwind configuration
├── convex.json                 # Convex configuration
├── package.json
└── tsconfig.json
```

---

## TMDB API Reference

### Required Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /search/movie` | Search movies by title |
| `GET /movie/{id}` | Get movie details |
| `GET /movie/{id}/credits` | Get cast and crew (for director) |
| `GET /person/{id}` | Get person details |
| `GET /person/{id}/movie_credits` | Get person's filmography |
| `GET /company/{id}` | Get company details |
| `GET /discover/movie` | Discover movies by company/year |
| `GET /configuration` | Get image base URLs |

### Image URLs
- Base URL: `https://image.tmdb.org/t/p/`
- Sizes: `w92`, `w154`, `w185`, `w342`, `w500`, `w780`, `original`
- Example: `https://image.tmdb.org/t/p/w500/poster_path.jpg`

---

## Next Steps

After plan approval:
1. Initialize Next.js project with all configurations
2. Set up Convex schema and basic functions
3. Integrate Clerk authentication
4. Build TMDB integration and caching
5. Implement core discovery feature
6. Add UI polish and remaining features
7. Deploy and iterate

---

## Notes

- **Rate Limiting**: TMDB has rate limits. Use Convex caching aggressively.
- **Real-time Updates**: Convex provides real-time subscriptions for favorites/watchlist.
- **Image Loading**: Always use TMDB's image CDN with appropriate sizes.
- **Error Handling**: Graceful degradation when TMDB is unavailable.
- **Accessibility**: Follow WCAG 2.1 AA guidelines for the UI.
