import { cn } from "@userbubble/ui";
import type { ReactNode } from "react";

type ColoredTileProps = {
  color: "salmon" | "purple" | "green" | "blue";
  label: string;
  icon?: ReactNode;
  className?: string;
};

const colorClasses = {
  salmon: "bg-[#FF6B6B] text-white",
  purple: "bg-[#6B5B95] text-white",
  green: "bg-[#4ECDC4] text-white",
  blue: "bg-[#45B7D1] text-white",
};

export function ColoredTile({
  color,
  label,
  icon,
  className,
}: ColoredTileProps) {
  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center rounded-xl p-8 shadow-sm transition-transform hover:scale-[1.02]",
        colorClasses[color],
        className
      )}
    >
      {icon && <div className="mb-3 text-4xl">{icon}</div>}
      <h3 className="font-bold text-3xl tracking-tight">{label}</h3>
    </div>
  );
}
