import { cn } from "@userbubble/ui";
import { ThemeProvider } from "@userbubble/ui/theme-provider";
import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Geist_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { env } from "~/env";

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

const geistMono = Geist_Mono({
  preload: false,
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      {/* <head>
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
      </head> */}
      <body
        className={cn(
          "min-h-screen bg-background font-sans text-foreground antialiased",
          geistMono.variable
        )}
      >
        {process.env.VERCEL === "1" && <Analytics />}
        <ThemeProvider>
          {props.children}
          {/* <div className="absolute right-4 bottom-4">
            <ThemeToggle />
          </div> */}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
