// TMDB API Types
export interface TMDBMovie {
  id: number;
  title: string;
  original_title?: string;
  overview?: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  runtime?: number;
  vote_average: number;
  vote_count: number;
  genres?: TMDBGenre[];
  genre_ids?: number[];
  production_companies?: TMDBCompany[];
}

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBCompany {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country?: string;
}

export interface TMDBPerson {
  id: number;
  name: string;
  profile_path: string | null;
  biography?: string;
  birthday?: string;
  place_of_birth?: string;
  known_for_department?: string;
}

export interface TMDBCrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface TMDBCredits {
  crew: TMDBCrewMember[];
}

export interface TMDBMovieCredits {
  crew: {
    id: number;
    title: string;
    release_date: string;
    poster_path: string | null;
    job: string;
    vote_average: number;
    vote_count: number;
  }[];
}

export interface TMDBSearchResult {
  page: number;
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
}

export interface TMDBCompanyMovies {
  page: number;
  results: TMDBMovie[];
  total_pages: number;
  total_results: number;
}

// App Types
export interface MovieDetails {
  tmdbId: number;
  title: string;
  originalTitle?: string;
  overview?: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string;
  releaseYear: number;
  runtime?: number;
  voteAverage: number;
  voteCount: number;
  genres: { id: number; name: string }[];
  directorId?: number;
  directorName?: string;
  productionCompanies: { id: number; name: string; logoPath: string | null }[];
}

export interface DirectorInfo {
  id: number;
  name: string;
  profilePath: string | null;
  biography?: string;
  birthday?: string;
  placeOfBirth?: string;
  totalFilms: number;
}

export interface StudioInfo {
  id: number;
  name: string;
  logoPath: string | null;
  description?: string;
  headquarters?: string;
  totalFilms: number;
}

export interface ScoreBreakdown {
  yearProximity: number;
  ratingQuality: number;
  genreOverlap: number;
  popularityBoost: number;
}

export interface ScoredMovie {
  movie: MovieDetails;
  score: number;
  scoreBreakdown: ScoreBreakdown;
}

export interface DirectorRecommendations {
  seedMovie: MovieDetails;
  director: DirectorInfo;
  recommendations: ScoredMovie[];
}

export interface StudioRecommendations {
  seedMovie: MovieDetails;
  studio: StudioInfo;
  recommendations: ScoredMovie[];
}

export type DiscoveryMode = "director" | "studio";
