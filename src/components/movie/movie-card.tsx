"use client";

import Image from "next/image";
import Link from "next/link";
import { Star, Heart, Plus, Check } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn, getImageUrl } from "@/lib/utils";

interface MovieCardProps {
  tmdbId: number;
  title: string;
  posterPath: string | null;
  releaseYear: number;
  voteAverage?: number;
  score?: number;
  scoreBreakdown?: {
    yearProximity: number;
    ratingQuality: number;
    genreOverlap: number;
    popularityBoost: number;
  };
  isFavorite?: boolean;
  isInWatchlist?: boolean;
  onToggleFavorite?: () => void;
  onToggleWatchlist?: () => void;
  onSelect?: () => void;
  showActions?: boolean;
  showScore?: boolean;
  size?: "sm" | "md" | "lg";
}

export function MovieCard({
  tmdbId,
  title,
  posterPath,
  releaseYear,
  voteAverage,
  score,
  scoreBreakdown,
  isFavorite,
  isInWatchlist,
  onToggleFavorite,
  onToggleWatchlist,
  onSelect,
  showActions = true,
  showScore = false,
  size = "md",
}: MovieCardProps) {
  const sizeClasses = {
    sm: "w-32",
    md: "w-40",
    lg: "w-48",
  };

  const imageHeights = {
    sm: "h-48",
    md: "h-60",
    lg: "h-72",
  };

  return (
    <Card
      className={cn(
        "group overflow-hidden transition-all hover:ring-2 hover:ring-primary/50",
        sizeClasses[size],
        onSelect && "cursor-pointer"
      )}
      onClick={onSelect}
    >
      <div className={cn("relative", imageHeights[size])}>
        <Image
          src={getImageUrl(posterPath, "w342")}
          alt={title}
          fill
          className="object-cover transition-transform group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, 25vw"
        />

        {/* Overlay on hover */}
        {showActions && (
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            {onToggleFavorite && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant={isFavorite ? "default" : "secondary"}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite();
                    }}
                  >
                    <Heart
                      className={cn("h-4 w-4", isFavorite && "fill-current")}
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isFavorite ? "Remove from favorites" : "Add to favorites"}
                </TooltipContent>
              </Tooltip>
            )}

            {onToggleWatchlist && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant={isInWatchlist ? "default" : "secondary"}
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleWatchlist();
                    }}
                  >
                    {isInWatchlist ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Plus className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isInWatchlist
                    ? "Remove from watchlist"
                    : "Add to watchlist"}
                </TooltipContent>
              </Tooltip>
            )}
          </div>
        )}

        {/* Score badge */}
        {showScore && score !== undefined && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge className="absolute top-2 right-2 bg-primary">
                {score} pts
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="left" className="text-xs">
              <div className="space-y-1">
                <div>Year proximity: +{scoreBreakdown?.yearProximity}</div>
                <div>Rating: +{scoreBreakdown?.ratingQuality}</div>
                <div>Genre overlap: +{scoreBreakdown?.genreOverlap}</div>
                <div>Popularity: +{scoreBreakdown?.popularityBoost}</div>
              </div>
            </TooltipContent>
          </Tooltip>
        )}
      </div>

      <CardContent className="p-3">
        <h3 className="font-medium text-sm line-clamp-2 mb-1">{title}</h3>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{releaseYear || "N/A"}</span>
          {voteAverage !== undefined && voteAverage > 0 && (
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
              {voteAverage.toFixed(1)}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
