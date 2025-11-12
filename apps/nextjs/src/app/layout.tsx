import { cn } from "@critichut/ui";
import { ThemeProvider, ThemeToggle } from "@critichut/ui/theme";
import { Toaster } from "@critichut/ui/toast";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { env } from "~/env";
import { TRPCReactProvider } from "~/trpc/react";

import "~/app/styles.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    env.VERCEL_ENV === "production"
      ? "https://critichut.com"
      : "http://localhost:3000"
  ),
  title: "Critichut - Turn User Feedback Into Product Success",
  description: "Collect, organize, and prioritize feedback from your users. Build what matters most with Critichut.",
  openGraph: {
    title: "Critichut - User Feedback & Product Roadmap Platform",
    description: "Collect, organize, and prioritize feedback from your users. Build what matters most.",
    url: "https://critichut.com",
    siteName: "Critichut",
  },
  twitter: {
    card: "summary_large_image",
    site: "@critichut",
    creator: "@critichut",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

const geistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans text-foreground antialiased",
          geistSans.variable,
          geistMono.variable
        )}
      >
        <ThemeProvider>
          <TRPCReactProvider>{props.children}</TRPCReactProvider>
          <div className="absolute right-4 bottom-4">
            <ThemeToggle />
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
