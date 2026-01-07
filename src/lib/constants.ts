export const TMDB_IMAGE_BASE_URL = "https://image.tmdb.org/t/p";

export const TMDB_IMAGE_SIZES = {
  poster: {
    small: "w185",
    medium: "w342",
    large: "w500",
    original: "original",
  },
  backdrop: {
    small: "w300",
    medium: "w780",
    large: "w1280",
    original: "original",
  },
  profile: {
    small: "w45",
    medium: "w185",
    large: "h632",
    original: "original",
  },
  logo: {
    small: "w92",
    medium: "w154",
    large: "w500",
    original: "original",
  },
} as const;

export const CACHE_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export const APP_NAME = "Movie Explorer";
export const APP_DESCRIPTION = "Discover movies by exploring director and studio filmographies";

export const ROUTES = {
  home: "/",
  signIn: "/sign-in",
  signUp: "/sign-up",
  explore: "/explore",
  favorites: "/favorites",
  watchlist: "/watchlist",
  history: "/history",
  settings: "/settings",
  movie: (id: number) => `/movie/${id}`,
  director: (id: number) => `/director/${id}`,
  studio: (id: number) => `/studio/${id}`,
} as const;
