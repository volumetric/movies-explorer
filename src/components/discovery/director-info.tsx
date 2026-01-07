"use client";

import Image from "next/image";
import { Calendar, MapPin, Film } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { getImageUrl } from "@/lib/utils";

interface DirectorInfoProps {
  id: number;
  name: string;
  profilePath: string | null;
  biography?: string;
  birthday?: string;
  placeOfBirth?: string;
  totalFilms: number;
}

export function DirectorInfo({
  id,
  name,
  profilePath,
  biography,
  birthday,
  placeOfBirth,
  totalFilms,
}: DirectorInfoProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Director Photo */}
          <div className="relative h-24 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-muted">
            {profilePath ? (
              <Image
                src={getImageUrl(profilePath, "w185")}
                alt={name}
                fill
                className="object-cover"
                sizes="80px"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <Film className="h-8 w-8" />
              </div>
            )}
          </div>

          {/* Director Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold">{name}</h3>

            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Film className="h-4 w-4" />
                {totalFilms} films as director
              </span>

              {birthday && (
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {birthday}
                </span>
              )}

              {placeOfBirth && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {placeOfBirth}
                </span>
              )}
            </div>

            {biography && (
              <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                {biography}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
