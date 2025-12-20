import type { Metadata } from "next";
import "./globals.css";

import { Footer } from "@/components/footer";
import { Navbar } from "@/components/navbar";
import { ThemeProvider } from "@/context/theme-provider";
import { getSEOTags } from "@/lib/seo";

export const metadata: Metadata = getSEOTags({
  keywords: [
    "feedback tool",
    "product roadmap",
    "changelog",
    "HMAC auth",
    "SSO feedback",
    "SaaS feedback platform",
    "customer feedback",
    "product management",
    "feature requests",
    "user feedback",
    "roadmap software",
    "auto-login",
    "zero-friction authentication",
  ],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="h-full font-primary [--pattern-fg:var(--color-charcoal-900)]/10 dark:bg-black dark:[--pattern-fg:var(--color-neutral-100)]/30">
        <ThemeProvider attribute="class" defaultTheme="system">
          <main className="antialiase h-full bg-background">
            <Navbar />
            {children}
            <Footer />
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
