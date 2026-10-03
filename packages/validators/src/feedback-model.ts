export const feedbackStatuses = [
  "open",
  "under_review",
  "planned",
  "in_progress",
  "completed",
  "closed",
] as const;
export type FeedbackStatus = (typeof feedbackStatuses)[number];

export const feedbackCategories = [
  "feature_request",
  "bug",
  "improvement",
  "question",
  "other",
] as const;
export type FeedbackCategory = (typeof feedbackCategories)[number];
