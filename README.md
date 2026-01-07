# Movie Explorer

Discover movies by exploring the works of directors and studios you already love. Find hidden gems from the same creative minds.

## Features

- **Movie Search** - Search for any movie using TMDB's extensive database
- **Director Discovery** - Find all movies by the same director, ranked by relevance
- **Studio Discovery** - Explore films from the same production studio
- **Smart Scoring** - Recommendations ranked by year proximity, rating, genre overlap, and popularity
- **Favorites** - Save movies you love for quick access
- **Watchlist** - Track movies you want to watch with watched/unwatched status
- **Discovery History** - Revisit your past explorations

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router), React 18, TypeScript |
| Styling | Tailwind CSS, ShadCN UI |
| Database | Convex |
| Authentication | Clerk (Google OAuth) |
| Payments | Stripe (ready for integration) |
| Analytics | PostHog |
| File Uploads | UploadThing |
| Movie Data | TMDB API |

## Prerequisites

- Node.js 18+
- pnpm (recommended) or npm
- Accounts for:
  - [Convex](https://convex.dev) (free tier available)
  - [Clerk](https://clerk.com) (free tier available)
  - [TMDB](https://www.themoviedb.org/settings/api) (free API key)
  - [Stripe](https://stripe.com) (optional, for payments)
  - [PostHog](https://posthog.com) (optional, for analytics)
  - [UploadThing](https://uploadthing.com) (optional, for file uploads)

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/volumetric/movies-explorer.git
cd movies-explorer
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Set up environment variables

Copy the example environment file:

```bash
cp .env.example .env.local
```

Fill in your credentials in `.env.local`:

```env
# Clerk Authentication (Required)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# Convex (Required)
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud

# TMDB API (Required)
TMDB_API_KEY=your_tmdb_api_key

# Stripe (Optional - for payments)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# PostHog (Optional - for analytics)
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com

# UploadThing (Optional - for file uploads)
UPLOADTHING_SECRET=sk_live_...
UPLOADTHING_APP_ID=...
```

### 4. Set up Convex

Initialize Convex for your project:

```bash
pnpm convex dev
```

This will:
- Create a new Convex project (if needed)
- Deploy your schema and functions
- Start the Convex development server

Keep this terminal running while developing.

### 5. Set up Clerk

1. Create a Clerk application at [clerk.com](https://clerk.com)
2. Enable Google OAuth in the Social Connections settings
3. Add your Clerk keys to `.env.local`
4. Configure the webhook endpoint in Clerk Dashboard:
   - URL: `https://your-domain.com/api/webhooks/clerk`
   - Events: `user.created`, `user.updated`, `user.deleted`

### 6. Get TMDB API Key

1. Create an account at [themoviedb.org](https://www.themoviedb.org)
2. Go to Settings > API
3. Request an API key (free for non-commercial use)
4. Add the API key to `.env.local`

### 7. Run the development server

In a new terminal (while Convex is running):

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
movies-explorer/
├── convex/                    # Convex backend
│   ├── schema.ts              # Database schema
│   ├── users.ts               # User queries/mutations
│   ├── favorites.ts           # Favorites management
│   ├── watchlist.ts           # Watchlist management
│   ├── discovery.ts           # Discovery sessions
│   └── tmdb.ts                # TMDB API integration
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/            # Auth pages (sign-in, sign-up)
│   │   ├── (dashboard)/       # Protected dashboard pages
│   │   ├── api/               # API routes (webhooks)
│   │   └── page.tsx           # Landing page
│   ├── components/
│   │   ├── discovery/         # Discovery UI components
│   │   ├── movie/             # Movie-related components
│   │   ├── providers/         # Context providers
│   │   └── ui/                # ShadCN UI components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utilities and helpers
│   └── types/                 # TypeScript types
└── public/                    # Static assets
```

## Key Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/sign-in` | Sign in with Google |
| `/sign-up` | Create account |
| `/explore` | Search and discover movies |
| `/favorites` | Your favorite movies |
| `/watchlist` | Movies to watch |
| `/history` | Discovery history |
| `/settings` | Account settings |

## Discovery Algorithm

Movies are scored based on:

| Factor | Max Points | Description |
|--------|------------|-------------|
| Year Proximity | 30 | Movies closer to the seed movie's release year score higher |
| Rating Quality | 25 | Higher-rated movies (TMDB vote average) score higher |
| Genre Overlap | 30 | More matching genres = higher score |
| Popularity | 15 | Movies with 1000+ votes get a boost |

All movies are included (no filtering) - the score only affects ranking.

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add all environment variables
4. Deploy

### Deploy Convex

```bash
pnpm convex deploy
```

### Configure Webhooks for Production

Update webhook URLs in Clerk and Stripe dashboards to use your production domain.

## Development Commands

```bash
pnpm dev          # Start Next.js dev server
pnpm convex dev   # Start Convex dev server
pnpm build        # Build for production
pnpm lint         # Run ESLint
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) for details.

## Acknowledgments

- Movie data provided by [TMDB](https://www.themoviedb.org)
- This product uses the TMDB API but is not endorsed or certified by TMDB.
