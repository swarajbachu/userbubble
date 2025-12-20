import { cn } from "@/lib/utils";

export const Scale = ({ className }: { className?: string }) => (
  <div
    className={cn(
      "absolute inset-0 z-10 m-auto h-full w-full rounded-lg border border-(--pattern-fg) bg-[image:repeating-linear-gradient(315deg,_var(--pattern-fg)_0,_var(--pattern-fg)_1px,_transparent_0,_transparent_50%)] bg-[size:10px_10px] bg-white dark:bg-neutral-900",
      className
    )}
  />
);
