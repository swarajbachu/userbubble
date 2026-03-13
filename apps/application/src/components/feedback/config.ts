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

export const statuses = [
  {
    value: "open",
    label: "Pending",
    icon: Clock02Icon,
    color: "text-orange-500",
    strokeWidth: 1,
  },
  {
    value: "under_review",
    label: "Under Review",
    icon: ClockAlertIcon,
    color: "text-amber-500",
  },
  {
    value: "planned",
    label: "Planned",
    icon: Clock01Icon,
    color: "text-violet-500",
  },
  {
    value: "in_progress",
    label: "In Progress",
    icon: Progress02Icon,
    color: "text-indigo-500",
  },
  {
    value: "completed",
    label: "Completed",
    icon: CheckmarkCircle01Icon,
    color: "text-emerald-500",
  },
  {
    value: "closed",
    label: "Closed",
    icon: CancelCircleIcon,
    color: "text-red-400",
    strokeWidth: 1,
  },
] as const;

export const allStatus = {
  label: "All",
  icon: AllBookmarkIcon,
  color: "text-zinc-400",
} as const;

export const categories = [
  {
    value: "feature_request",
    label: "Feature",
    icon: Rocket01Icon,
    color: "text-purple-500",
  },
  { value: "bug", label: "Bug", icon: AlertCircleIcon, color: "text-red-500" },
  {
    value: "improvement",
    label: "Improvement",
    icon: ArrowUp01Icon,
    color: "text-blue-500",
  },
  {
    value: "question",
    label: "Question",
    icon: HelpCircleIcon,
    color: "text-yellow-500",
  },
  { value: "other", label: "Other", icon: Menu01Icon, color: "text-slate-500" },
] as const;

export const getStatus = (value: string) =>
  statuses.find((s) => s.value === value);
export const getCategory = (value: string) =>
  categories.find((c) => c.value === value);
