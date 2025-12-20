import { cn } from "@/lib/utils";

export const DivideX = ({ className }: { className?: string }) => (
  <div className={cn("h-[1px] w-full bg-divide", className)} />
);
