import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

import { ConvexClientProvider } from "@/components/providers/convex-client-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { PostHogProvider, PostHogIdentify } from "@/components/providers/posthog-provider";
import { UserSyncProvider } from "@/components/providers/user-sync-provider";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Movie Explorer - Discover Films by Director & Studio",
  description:
    "Explore movies by finding other great films from the same director or studio. Discover hidden gems from your favorite filmmakers.",
  keywords: [
    "movies",
    "films",
    "director",
    "studio",
    "discovery",
    "recommendations",
    "watchlist",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: dark,
        variables: {
          colorPrimary: "#8b5cf6",
        },
      }}
    >
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className}>
          <ThemeProvider defaultTheme="dark" storageKey="movie-explorer-theme">
            <PostHogProvider>
              <ConvexClientProvider>
                <UserSyncProvider>
                  <TooltipProvider>
                    <PostHogIdentify />
                    {children}
                    <Toaster />
                  </TooltipProvider>
                </UserSyncProvider>
              </ConvexClientProvider>
            </PostHogProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
