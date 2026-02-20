import { ArrowRight, BookOpen, Code, Smartphone } from "lucide-react";
import Link from "next/link";

export default function HomePage() {
  return (
    <main className="container flex max-w-4xl flex-col gap-16 py-16 md:py-24">
      <div className="flex flex-col gap-4">
        <h1 className="font-bold text-3xl md:text-4xl">
          Userbubble Documentation
        </h1>
        <p className="max-w-2xl text-fd-muted-foreground text-lg">
          Collect feedback, share your roadmap, and keep users in the loop — all
          from an embeddable widget that lives inside your product.
        </p>
        <div className="mt-2 flex gap-3">
          <Link
            className="inline-flex items-center gap-2 rounded-full bg-fd-primary px-5 py-2 font-medium text-fd-primary-foreground text-sm transition-opacity hover:opacity-90"
            href="/docs"
          >
            Get started
            <ArrowRight className="size-4" />
          </Link>
          <Link
            className="inline-flex items-center gap-2 rounded-full border border-fd-border px-5 py-2 font-medium text-fd-foreground text-sm transition-colors hover:bg-fd-accent"
            href="/docs/sdks"
          >
            SDKs
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          className="group flex flex-col gap-3 rounded-xl border border-fd-border bg-fd-card p-6 transition-colors hover:bg-fd-accent/50"
          href="/docs/sdks/web"
        >
          <div className="flex size-10 items-center justify-center rounded-lg bg-fd-primary/10">
            <Code className="size-5 text-fd-primary" />
          </div>
          <div>
            <h2 className="font-semibold">Web SDK</h2>
            <p className="mt-1 text-fd-muted-foreground text-sm">
              Script tag, npm package, or React component — pick what fits your
              stack.
            </p>
          </div>
          <span className="mt-auto inline-flex items-center gap-1 text-fd-muted-foreground text-sm group-hover:text-fd-foreground">
            View docs
            <ArrowRight className="size-3.5" />
          </span>
        </Link>

        <Link
          className="group flex flex-col gap-3 rounded-xl border border-fd-border bg-fd-card p-6 transition-colors hover:bg-fd-accent/50"
          href="/docs/sdks/react-native"
        >
          <div className="flex size-10 items-center justify-center rounded-lg bg-fd-primary/10">
            <Smartphone className="size-5 text-fd-primary" />
          </div>
          <div>
            <h2 className="font-semibold">React Native SDK</h2>
            <p className="mt-1 text-fd-muted-foreground text-sm">
              Native widget for React Native and Expo applications.
            </p>
          </div>
          <span className="mt-auto inline-flex items-center gap-1 text-fd-muted-foreground text-sm group-hover:text-fd-foreground">
            View docs
            <ArrowRight className="size-3.5" />
          </span>
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        <h2 className="font-semibold text-xl">Resources</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Link
            className="flex items-center gap-3 rounded-lg border border-fd-border p-4 transition-colors hover:bg-fd-accent/50"
            href="/docs/sdks/web/quick-start"
          >
            <BookOpen className="size-4 shrink-0 text-fd-muted-foreground" />
            <span className="text-sm">Quick Start</span>
          </Link>
          <Link
            className="flex items-center gap-3 rounded-lg border border-fd-border p-4 transition-colors hover:bg-fd-accent/50"
            href="/docs/sdks/web/api-reference"
          >
            <Code className="size-4 shrink-0 text-fd-muted-foreground" />
            <span className="text-sm">API Reference</span>
          </Link>
          <Link
            className="flex items-center gap-3 rounded-lg border border-fd-border p-4 transition-colors hover:bg-fd-accent/50"
            href="/docs/sdks/web/examples"
          >
            <BookOpen className="size-4 shrink-0 text-fd-muted-foreground" />
            <span className="text-sm">Examples</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
