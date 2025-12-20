"use client";

import { useEffect } from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("Global application error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
          <div className="w-full max-w-md rounded-xl border bg-card p-12 text-center shadow-lg">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-950">
              {/** biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
              <svg
                className="h-8 w-8 text-red-500"
                fill="none"
                role="img"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <h1 className="mb-2 font-semibold text-2xl">
              Something Went Wrong
            </h1>
            <p className="mb-8 text-muted-foreground text-sm">
              A critical error occurred. Please try refreshing the page.
            </p>

            <button
              className="rounded-lg bg-primary px-6 py-2.5 font-medium text-primary-foreground text-sm transition-colors hover:bg-primary/90"
              onClick={reset}
              type="button"
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
