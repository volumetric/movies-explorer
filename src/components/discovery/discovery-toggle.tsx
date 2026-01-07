"use client";

import { User, Building2 } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export type DiscoveryMode = "director" | "studio";

interface DiscoveryToggleProps {
  mode: DiscoveryMode;
  onModeChange: (mode: DiscoveryMode) => void;
  directorName?: string;
  studioName?: string;
  className?: string;
}

export function DiscoveryToggle({
  mode,
  onModeChange,
  directorName,
  studioName,
  className,
}: DiscoveryToggleProps) {
  return (
    <Tabs
      value={mode}
      onValueChange={(value) => onModeChange(value as DiscoveryMode)}
      className={cn("w-full", className)}
    >
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="director" className="flex items-center gap-2">
          <User className="h-4 w-4" />
          <span className="hidden sm:inline">By the same Director</span>
          <span className="sm:hidden">Director</span>
        </TabsTrigger>
        <TabsTrigger value="studio" className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          <span className="hidden sm:inline">By the same Studio</span>
          <span className="sm:hidden">Studio</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
