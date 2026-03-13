import {
  AlertCircleIcon,
  AllBookmarkIcon,
  ArrowUp01Icon,
  CancelCircleIcon,
  CheckmarkCircle01Icon,
  Clock01Icon,
  Clock02Icon,
  ClockAlertIcon,
  HelpCircleIcon,
  Menu01Icon,
  Progress02Icon,
  Rocket01Icon,
} from "@hugeicons-pro/core-bulk-rounded";

export const statusConfig = {
  open: { color: "text-orange-500", icon: Clock02Icon, strokeWidth: 1 },
  under_review: { color: "text-amber-500", icon: ClockAlertIcon },
  planned: { color: "text-violet-500", icon: Clock01Icon },
  in_progress: { color: "text-indigo-500", icon: Progress02Icon },
  completed: { color: "text-emerald-500", icon: CheckmarkCircle01Icon },
  closed: { color: "text-red-400", icon: CancelCircleIcon, strokeWidth: 1 },
} as const;

export const statusAllConfig = {
  color: "text-zinc-400",
  icon: AllBookmarkIcon,
} as const;

export const categoryConfig = {
  feature_request: { color: "text-purple-500", icon: Rocket01Icon },
  bug: { color: "text-red-500", icon: AlertCircleIcon },
  improvement: { color: "text-blue-500", icon: ArrowUp01Icon },
  question: { color: "text-yellow-500", icon: HelpCircleIcon },
  other: { color: "text-slate-500", icon: Menu01Icon },
} as const;

export const categoryLabels = {
  feature_request: "Feature",
  bug: "Bug",
  improvement: "Improvement",
  question: "Question",
  other: "Other",
} as const;
