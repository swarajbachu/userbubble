"use client";

import { useEffect } from "react";
import { ErrorDisplay } from "~/components/errors/error-display";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function ErrorBoundary({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return <ErrorDisplay reset={reset} type="500" />;
}
