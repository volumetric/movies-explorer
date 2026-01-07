"use client";

import { useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";

export function UserSyncProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoaded } = useUser();

  const convexUser = useQuery(
    api.users.getUser,
    user?.id ? { clerkId: user.id } : "skip"
  );

  const createUser = useMutation(api.users.createUser);

  useEffect(() => {
    async function syncUser() {
      if (isLoaded && user && convexUser === null) {
        try {
          await createUser({
            clerkId: user.id,
            email: user.emailAddresses[0]?.emailAddress || "",
            name: user.fullName || undefined,
            imageUrl: user.imageUrl || undefined,
          });
        } catch (error) {
          console.error("Failed to sync user:", error);
        }
      }
    }
    syncUser();
  }, [isLoaded, user, convexUser, createUser]);

  return <>{children}</>;
}
