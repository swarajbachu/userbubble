"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Message01Icon,
  RoadIcon,
  TaskDaily01Icon,
} from "@hugeicons-pro/core-duotone-rounded";
import { cn } from "@userbubble/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";

type EmbedTabBarProps = {
  orgSlug: string;
  enableRoadmap: boolean;
};

export function EmbedTabBar({ orgSlug, enableRoadmap }: EmbedTabBarProps) {
  const pathname = usePathname();

  const tabs = [
    {
      label: "Feedback",
      href: `/embed/${orgSlug}/feedback`,
      icon: Message01Icon,
      match: "/feedback",
    },
    ...(enableRoadmap
      ? [
          {
            label: "Roadmap",
            href: `/embed/${orgSlug}/roadmap`,
            icon: RoadIcon,
            match: "/roadmap",
          },
        ]
      : []),
    {
      label: "Updates",
      href: `/embed/${orgSlug}/changelog`,
      icon: TaskDaily01Icon,
      match: "/changelog",
    },
  ];

  return (
    <div className="shrink-0 border-t bg-background">
      <nav className="flex items-center justify-around px-2 py-1.5">
        {tabs.map((tab) => {
          const isActive = pathname.includes(tab.match);
          return (
            <Link
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 rounded-lg px-2 py-1.5 font-medium text-[11px] transition-colors",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
              href={tab.href}
              key={tab.match}
            >
              <HugeiconsIcon
                color={
                  isActive ? "var(--brand-accent, #3b82f6)" : "currentColor"
                }
                icon={tab.icon}
                size={18}
              />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="pb-1 text-center">
        <span className="text-[10px] text-muted-foreground/50">
          Powered by Userbubble
        </span>
      </div>
    </div>
  );
}
