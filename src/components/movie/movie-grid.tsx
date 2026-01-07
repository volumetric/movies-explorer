"use client";

import { cn } from "@/lib/utils";

interface MovieGridProps {
  children: React.ReactNode;
  className?: string;
}

export function MovieGrid({ children, className }: MovieGridProps) {
  return (
    <div
      className={cn(
        "grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
        className
      )}
    >
      {children}
    </div>
  );
}
