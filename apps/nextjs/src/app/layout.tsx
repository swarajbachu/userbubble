import { cn } from "@userbubble/ui";
import { ThemeProvider } from "@userbubble/ui/theme";
import { Toaster } from "@userbubble/ui/toast";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { env } from "~/env";
import { TRPCReactProvider } from "~/trpc/react";

import "~/app/styles.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    env.VERCEL_ENV === "production"
      ? "https://userbubble.com"
      : "http://localhost:3000"
  ),
  title: "Userbubble - Turn User Feedback Into Product Success",
  description:
    "Collect, organize, and prioritize feedback from your users. Build what matters most with Userbubble.",
  openGraph: {
    title: "Userbubble - User Feedback & Product Roadmap Platform",
    description:
      "Collect, organize, and prioritize feedback from your users. Build what matters most.",
    url: "https://userbubble.com",
    siteName: "Userbubble",
  },
  twitter: {
    card: "summary_large_image",
    site: "@userbubble",
    creator: "@userbubble",
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
      <head>
        {process.env.NODE_ENV === "development" && (
          <>
            <Script
              src="//unpkg.com/react-grab/dist/index.global.js"
              strategy="beforeInteractive"
            />
            <Script
              src="//unpkg.com/@react-grab/claude-code/dist/client.global.js"
              strategy="lazyOnload"
            />
          </>
        )}
      </head>
      <body
        className={cn(
          "min-h-screen bg-background font-sans text-foreground antialiased",
          geistSans.variable,
          geistMono.variable
        )}
      >
        <ThemeProvider>
          <TRPCReactProvider>
            <NuqsAdapter>{props.children}</NuqsAdapter>
          </TRPCReactProvider>
          {/* <div className="absolute right-4 bottom-4">
            <ThemeToggle />
          </div> */}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
