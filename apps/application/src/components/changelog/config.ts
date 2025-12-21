import {
  AlertCircleIcon,
  ArrowUp01Icon,
  Rocket01Icon,
  SparklesIcon,
} from "@hugeicons-pro/core-bulk-rounded";

export const tagConfig = {
  feature: {
    color: "text-purple-500",
    bg: "bg-purple-500/10",
    icon: Rocket01Icon,
    label: "Feature",
  },
  improvement: {
    color: "text-blue-500",
    bg: "bg-blue-500/10",
    icon: ArrowUp01Icon,
    label: "Improvement",
  },
  bugfix: {
    color: "text-red-500",
    bg: "bg-red-500/10",
    icon: AlertCircleIcon,
    label: "Bug Fix",
  },
  announcement: {
    color: "text-yellow-500",
    bg: "bg-yellow-500/10",
    icon: SparklesIcon,
    label: "Announcement",
  },
} as const;

export type ChangelogTag = keyof typeof tagConfig;
