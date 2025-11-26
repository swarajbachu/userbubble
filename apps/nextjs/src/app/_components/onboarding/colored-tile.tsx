import { cn } from "@critichut/ui";
import type { ReactNode } from "react";

type ColoredTileProps = {
  color: "salmon" | "purple" | "green" | "blue";
  label: string;
  icon?: ReactNode;
};

const colorClasses = {
  salmon: "bg-gradient-to-br from-orange-400 to-pink-400",
  purple: "bg-gradient-to-br from-purple-400 to-indigo-400",
  green: "bg-gradient-to-br from-green-400 to-emerald-400",
  blue: "bg-gradient-to-br from-blue-400 to-cyan-400",
};

export function ColoredTile({ color, label, icon }: ColoredTileProps) {
  return (
    <div
      className={cn(
        "flex h-full min-h-[150px] flex-col items-center justify-center rounded-lg p-6 text-white shadow-lg transition-transform hover:scale-105",
        colorClasses[color]
      )}
    >
      {icon && <div className="mb-3 text-4xl">{icon}</div>}
      <h3 className="font-semibold text-xl">{label}</h3>
    </div>
  );
}
