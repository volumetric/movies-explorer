"use client";

import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { Settings, User, CreditCard, Shield, Bell } from "lucide-react";

import { api } from "../../../../convex/_generated/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsPage() {
  const { user, isLoaded } = useUser();

  const convexUser = useQuery(
    api.users.getUser,
    user?.id ? { clerkId: user.id } : "skip"
  );

  if (!isLoaded || !convexUser) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile
          </CardTitle>
          <CardDescription>Your account information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user?.imageUrl} />
              <AvatarFallback>
                {user?.firstName?.[0]}
                {user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{user?.fullName || "User"}</h3>
              <p className="text-sm text-muted-foreground">
                {user?.emailAddresses[0]?.emailAddress}
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Manage Account</p>
              <p className="text-sm text-muted-foreground">
                Update your profile, password, and more
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                // Opens Clerk user profile
                const userButton = document.querySelector(
                  '[data-clerk-user-button-trigger]'
                ) as HTMLButtonElement;
                userButton?.click();
              }}
            >
              Manage
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Subscription
          </CardTitle>
          <CardDescription>Manage your subscription plan</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium">Current Plan</p>
                <Badge variant={convexUser.isPremium ? "default" : "secondary"}>
                  {convexUser.isPremium ? "Premium" : "Free"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {convexUser.isPremium
                  ? "You have access to all premium features"
                  : "Upgrade to unlock all features"}
              </p>
            </div>
            {!convexUser.isPremium && (
              <Button>Upgrade to Premium</Button>
            )}
          </div>

          {!convexUser.isPremium && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="font-medium">Premium Features:</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Unlimited discovery sessions</li>
                  <li>• Advanced filters (genre, rating, decade)</li>
                  <li>• Export watchlist to CSV</li>
                  <li>• Priority API access</li>
                  <li>• No ads</li>
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Privacy Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Privacy
          </CardTitle>
          <CardDescription>Manage your data and privacy settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Discovery History</p>
              <p className="text-sm text-muted-foreground">
                We store your exploration history to help you revisit discoveries
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all data
              </p>
            </div>
            <Button variant="destructive" size="sm">
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* About Section */}
      <Card>
        <CardHeader>
          <CardTitle>About</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>Movie Explorer v0.1.0</p>
          <p>Powered by TMDB API</p>
          <p>
            This product uses the TMDB API but is not endorsed or certified by
            TMDB.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
