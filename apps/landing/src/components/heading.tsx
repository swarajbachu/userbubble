import type React from "react";
import { cn } from "@/lib/utils";

export const Heading = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <h1
    className={cn(
      "text-center font-medium text-3xl text-black tracking-tight md:text-4xl lg:text-6xl dark:text-white",
      className
    )}
  >
    {children}
  </h1>
);
