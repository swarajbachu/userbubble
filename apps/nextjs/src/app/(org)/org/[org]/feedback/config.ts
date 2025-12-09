import {
  Cancel01Icon,
  CheckmarkBadge01Icon,
  CircleIcon,
  Clock01Icon,
  EyeIcon,
  HourglassIcon,
} from "@hugeicons-pro/core-bulk-rounded";

export const statusConfig = {
  open: { color: "text-blue-500", icon: CircleIcon },
  under_review: { color: "text-yellow-500", icon: EyeIcon },
  planned: { color: "text-purple-500", icon: Clock01Icon },
  in_progress: { color: "text-orange-500", icon: HourglassIcon },
  completed: { color: "text-green-500", icon: CheckmarkBadge01Icon },
  closed: { color: "text-slate-500", icon: Cancel01Icon },
} as const;

export const categoryLabels = {
  feature_request: "Feature",
  bug: "Bug",
  improvement: "Improvement",
  question: "Question",
  other: "Other",
} as const;
