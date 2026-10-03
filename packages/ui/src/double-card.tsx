import * as React from "react";

import { cn } from ".";
import { Card } from "./card";

const DoubleCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    className={cn(
      "squircle overflow-hidden rounded-2xl bg-muted/40 shadow-[0_2px_8px_-3px_rgb(0_0_0/0.12)]",
      className
    )}
    ref={ref}
    {...props}
  />
));
DoubleCard.displayName = "DoubleCard";

const DoubleCardInner = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<typeof Card>
>(({ className, ...props }, ref) => (
  <Card
    className={cn(
      "squircle rounded-xl border-0 bg-card shadow-none",
      className
    )}
    ref={ref}
    {...props}
  />
));
DoubleCardInner.displayName = "DoubleCardInner";

const DoubleCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div className={cn("p-4", className)} ref={ref} {...props} />
));
DoubleCardFooter.displayName = "DoubleCardFooter";

const DoubleCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div className={cn("px-4 py-2", className)} ref={ref} {...props} />
));
DoubleCardHeader.displayName = "DoubleCardHeader";

export { DoubleCard, DoubleCardFooter, DoubleCardHeader, DoubleCardInner };
