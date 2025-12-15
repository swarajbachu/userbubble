import * as React from "react";

import { cn } from ".";
import { Card } from "./card";

const DoubleCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    className={cn(
      "rounded-2xl bg-secondary p-1 shadow-sm dark:bg-muted/10",
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
    className={cn("border-none shadow-md", className)}
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
