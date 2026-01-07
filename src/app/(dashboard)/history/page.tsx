"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery, useMutation } from "convex/react";
import { History, Trash2, User, Building2 } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { formatDistanceToNow } from "date-fns";

import { api } from "../../../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { getImageUrl } from "@/lib/utils";

export default function HistoryPage() {
  const { user } = useUser();
  const { toast } = useToast();

  const convexUser = useQuery(
    api.users.getUser,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const history = useQuery(
    api.discovery.getDiscoveryHistory,
    convexUser?._id ? { userId: convexUser._id, limit: 50 } : "skip"
  );

  const deleteSession = useMutation(api.discovery.deleteDiscoverySession);
  const clearHistory = useMutation(api.discovery.clearDiscoveryHistory);

  const handleDelete = async (sessionId: any) => {
    try {
      await deleteSession({ sessionId });
      toast({ title: "Session removed from history" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete session",
        variant: "destructive",
      });
    }
  };

  const handleClearAll = async () => {
    if (!convexUser) return;
    if (!confirm("Are you sure you want to clear all history?")) return;
    try {
      await clearHistory({ userId: convexUser._id });
      toast({ title: "History cleared" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to clear history",
        variant: "destructive",
      });
    }
  };

  if (!convexUser || history === undefined) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Discovery History</h1>
          <span className="text-muted-foreground">({history?.length || 0})</span>
        </div>
        {history && history.length > 0 && (
          <Button variant="outline" size="sm" onClick={handleClearAll}>
            <Trash2 className="h-4 w-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>

      {/* Empty state */}
      {history && history.length === 0 && (
        <div className="text-center py-24">
          <History className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No discovery history</h2>
          <p className="text-muted-foreground mb-6">
            Your movie explorations will appear here
          </p>
          <Button asChild>
            <Link href="/explore">Start Exploring</Link>
          </Button>
        </div>
      )}

      {/* History list */}
      {history && history.length > 0 && (
        <div className="space-y-4">
          {history.map((session) => (
            <Card key={session._id} className="group">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  {/* Movie poster */}
                  <div className="relative h-20 w-14 flex-shrink-0 overflow-hidden rounded">
                    <Image
                      src={getImageUrl(session.seedMoviePosterPath, "w92")}
                      alt={session.seedMovieTitle}
                      fill
                      className="object-cover"
                      sizes="56px"
                    />
                  </div>

                  {/* Session info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">
                      {session.seedMovieTitle}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {session.mode === "director" ? (
                          <>
                            <User className="h-3 w-3 mr-1" />
                            {session.directorName || "Director"}
                          </>
                        ) : (
                          <>
                            <Building2 className="h-3 w-3 mr-1" />
                            {session.studioName || "Studio"}
                          </>
                        )}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {session.recommendedMovieIds?.length || 0} recommendations
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(session.createdAt, { addSuffix: true })}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(session._id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
