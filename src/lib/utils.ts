import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatYear(dateString: string | undefined): number {
  if (!dateString) return 0;
  return new Date(dateString).getFullYear();
}

export function getImageUrl(path: string | null | undefined, size: string = "w500"): string {
  if (!path) return "/placeholder-movie.png";
  return `https://image.tmdb.org/t/p/${size}${path}`;
}

export function calculateYearProximityScore(seedYear: number, movieYear: number): number {
  const diff = Math.abs(seedYear - movieYear);
  if (diff === 0) return 30;
  if (diff === 1) return 27;
  if (diff === 2) return 24;
  if (diff === 3) return 21;
  if (diff === 4) return 18;
  if (diff === 5) return 15;
  if (diff <= 10) return 10;
  if (diff <= 15) return 5;
  return 2;
}

export function calculateRatingScore(voteAverage: number): number {
  if (voteAverage >= 8.0) return 25;
  if (voteAverage >= 7.0) return 20;
  if (voteAverage >= 6.0) return 15;
  if (voteAverage >= 5.0) return 10;
  return 5;
}

export function calculateGenreOverlapScore(
  seedGenres: number[],
  movieGenres: number[]
): number {
  const overlap = seedGenres.filter((g) => movieGenres.includes(g)).length;
  return Math.min(overlap * 10, 30);
}

export function calculatePopularityScore(voteCount: number): number {
  return voteCount > 1000 ? 15 : 0;
}
