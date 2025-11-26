import { z } from "zod";
import { feedbackCategories, feedbackStatuses } from "./feedback.sql";

export const feedbackStatusValidator = z.enum(feedbackStatuses);
export const feedbackCategoryValidator = z.enum(feedbackCategories);

export const createFeedbackValidator = z.object({
  organizationId: z.string().min(1),
  title: z.string().min(3).max(256),
  description: z.string().min(10).max(5000),
  category: feedbackCategoryValidator,
});

export const updateFeedbackValidator = z.object({
  title: z.string().min(3).max(256).optional(),
  description: z.string().min(10).max(5000).optional(),
  status: feedbackStatusValidator.optional(),
  category: feedbackCategoryValidator.optional(),
});
