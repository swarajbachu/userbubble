"use client";

import { cn } from "@userbubble/ui";
import Link from "next/link";
import { usePathname } from "next/navigation";

type EmbedTabBarProps = {
  orgSlug: string;
  enableRoadmap: boolean;
};

const feedbackIcon = (
  <svg
    fill="none"
    height="18"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="18"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
  </svg>
);

const roadmapIcon = (
  <svg
    fill="none"
    height="18"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="18"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

const changelogIcon = (
  <svg
    fill="none"
    height="18"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    strokeWidth="2"
    viewBox="0 0 24 24"
    width="18"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <path d="M10 18v-1" />
    <path d="M14 18v-3" />
    <path d="M18 18v-5" />
  </svg>
);

export function EmbedTabBar({ orgSlug, enableRoadmap }: EmbedTabBarProps) {
  const pathname = usePathname();

  const tabs = [
    {
      label: "Feedback",
      href: `/external/${orgSlug}/embed/feedback`,
      icon: feedbackIcon,
      match: "/feedback",
    },
    ...(enableRoadmap
      ? [
          {
            label: "Roadmap",
            href: `/external/${orgSlug}/embed/roadmap`,
            icon: roadmapIcon,
            match: "/roadmap",
          },
        ]
      : []),
    {
      label: "Updates",
      href: `/external/${orgSlug}/embed/changelog`,
      icon: changelogIcon,
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
              <span
                className={cn(
                  "transition-colors",
                  isActive ? "text-[var(--brand-accent,#3b82f6)]" : ""
                )}
              >
                {tab.icon}
              </span>
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
