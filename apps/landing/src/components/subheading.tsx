import type React from "react";
import { cn } from "@/lib/utils";

export const SubHeading = ({
  children,
  className,
  as: Component = "h2",
}: {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}) => (
  <Component
    className={cn(
      "text-center font-medium text-gray-600 text-sm tracking-tight md:text-sm lg:text-base dark:text-gray-300",
      className
    )}
  >
    {children}
  </Component>
);
