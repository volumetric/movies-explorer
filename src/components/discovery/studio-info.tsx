"use client";

import Image from "next/image";
import { MapPin, Film, Building2 } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { getImageUrl } from "@/lib/utils";

interface StudioInfoProps {
  id: number;
  name: string;
  logoPath: string | null;
  description?: string;
  headquarters?: string;
  totalFilms: number;
}

export function StudioInfo({
  id,
  name,
  logoPath,
  description,
  headquarters,
  totalFilms,
}: StudioInfoProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Studio Logo */}
          <div className="relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-lg bg-white p-2">
            {logoPath ? (
              <Image
                src={getImageUrl(logoPath, "w154")}
                alt={name}
                fill
                className="object-contain"
                sizes="112px"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground bg-muted rounded">
                <Building2 className="h-8 w-8" />
              </div>
            )}
          </div>

          {/* Studio Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold">{name}</h3>

            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Film className="h-4 w-4" />
                {totalFilms}+ films produced
              </span>

              {headquarters && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {headquarters}
                </span>
              )}
            </div>

            {description && (
              <p className="mt-3 text-sm text-muted-foreground line-clamp-2">
                {description}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
