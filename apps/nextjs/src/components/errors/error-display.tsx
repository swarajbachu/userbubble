import type { IconSvgObject } from "@hugeicons/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  ArrowLeft01Icon,
  Cancel01Icon,
  CustomerSupportIcon,
} from "@hugeicons-pro/core-bulk-rounded";
import { Button } from "@userbubble/ui/button";
import { DoubleCard, DoubleCardInner } from "@userbubble/ui/double-card";
import Link from "next/link";

type ErrorType = "404" | "403" | "500";

type ErrorDisplayProps = {
  type: ErrorType;
  reset?: () => void;
};

const errorConfig: Record<
  ErrorType,
  {
    icon: IconSvgObject;
    iconColor: string;
    title: string;
    description: string;
    showReset?: boolean;
  }
> = {
  "404": {
    icon: Cancel01Icon,
    iconColor: "text-muted-foreground",
    title: "Page Not Found",
    description:
      "The page you're looking for doesn't exist or has been moved. Please check the URL or return to the homepage.",
    showReset: false,
  },
  "403": {
    icon: Alert02Icon,
    iconColor: "text-orange-500",
    title: "Access Denied",
    description:
      "You don't have permission to access this resource. If you believe this is an error, please contact support.",
    showReset: false,
  },
  "500": {
    icon: Alert02Icon,
    iconColor: "text-red-500",
    title: "Something Went Wrong",
    description:
      "An unexpected error occurred. We've been notified and are working to fix it. Please try again in a moment.",
    showReset: true,
  },
};

export function ErrorDisplay({ type, reset }: ErrorDisplayProps) {
  const config = errorConfig[type];

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center p-4">
      <DoubleCard className="w-full max-w-md">
        <DoubleCardInner className="flex flex-col items-center justify-center p-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <HugeiconsIcon
              className={config.iconColor}
              icon={config.icon}
              size={32}
            />
          </div>

          <h1 className="mb-2 font-semibold text-2xl">{config.title}</h1>
          <p className="mb-8 max-w-sm text-muted-foreground text-sm">
            {config.description}
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button render={<Link href="/" />} size="lg" variant="default">
              <HugeiconsIcon icon={ArrowLeft01Icon} size={20} />
              Go Home
            </Button>

            {config.showReset && reset && (
              <Button onClick={reset} size="lg" variant="outline">
                Try Again
              </Button>
            )}

            {type === "403" && (
              <Button
                render={<Link href="/support" />}
                size="lg"
                variant="outline"
              >
                <HugeiconsIcon icon={CustomerSupportIcon} size={20} />
                Contact Support
              </Button>
            )}
          </div>
        </DoubleCardInner>
      </DoubleCard>
    </div>
  );
}
