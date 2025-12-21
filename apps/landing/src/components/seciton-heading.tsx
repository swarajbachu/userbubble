import type React from "react";
import { cn } from "@/lib/utils";

export const SectionHeading = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <h2
    className={cn(
      "text-center font-medium text-2xl text-charcoal-700 tracking-tight md:text-3xl lg:text-4xl dark:text-neutral-100",
      className
    )}
  >
    {children}
  </h2>
);
