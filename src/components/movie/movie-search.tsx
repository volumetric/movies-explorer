"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Search, Loader2, X } from "lucide-react";
import { useAction } from "convex/react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api } from "../../../convex/_generated/api";
import { getImageUrl, cn } from "@/lib/utils";

interface SearchResult {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  releaseYear: number;
  voteAverage: number;
}

interface MovieSearchProps {
  onSelectMovie: (movie: SearchResult) => void;
  placeholder?: string;
  className?: string;
}

export function MovieSearch({
  onSelectMovie,
  placeholder = "Search for a movie...",
  className,
}: MovieSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const searchMovies = useAction(api.tmdb.searchMovies);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await searchMovies({ query });
        setResults(data.results);
        setIsOpen(true);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchMovies]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (movie: SearchResult) => {
    onSelectMovie(movie);
    setQuery("");
    setResults([]);
    setIsOpen(false);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setIsOpen(false);
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-10 pr-10"
          onFocus={() => results.length > 0 && setIsOpen(true)}
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
            onClick={handleClear}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 mt-2 w-full rounded-md border bg-popover shadow-lg">
          <ScrollArea className="max-h-80">
            <div className="p-2">
              {results.map((movie) => (
                <button
                  key={movie.tmdbId}
                  onClick={() => handleSelect(movie)}
                  className="flex w-full items-center gap-3 rounded-md p-2 text-left hover:bg-muted transition-colors"
                >
                  <div className="relative h-16 w-12 flex-shrink-0 overflow-hidden rounded">
                    <Image
                      src={getImageUrl(movie.posterPath, "w92")}
                      alt={movie.title}
                      fill
                      className="object-cover"
                      sizes="48px"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{movie.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {movie.releaseYear || "Unknown year"}
                      {movie.voteAverage > 0 && ` • ★ ${movie.voteAverage.toFixed(1)}`}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* No results message */}
      {isOpen && query && !isLoading && results.length === 0 && (
        <div className="absolute z-50 mt-2 w-full rounded-md border bg-popover p-4 text-center shadow-lg">
          <p className="text-sm text-muted-foreground">
            No movies found for &quot;{query}&quot;
          </p>
        </div>
      )}
    </div>
  );
}
