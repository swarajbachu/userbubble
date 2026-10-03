import * as z from "zod/mini";
import { feedbackCategories, feedbackStatuses } from "./feedback-model";

export const feedbackStatusValidator = z.enum(feedbackStatuses);
export const feedbackStatusListValidator = z.array(feedbackStatusValidator);
export const feedbackCategoryValidator = z.enum(feedbackCategories);

export const createFeedbackValidator = z.object({
  organizationId: z.string().check(z.minLength(1)),
  title: z.string().check(z.minLength(3), z.maxLength(256)),
  description: z.string().check(z.minLength(10), z.maxLength(5000)),
  category: feedbackCategoryValidator,
  isPublic: z.optional(z.boolean()),
});

export const updateFeedbackValidator = z.object({
  expectedRevision: z.optional(z.int().check(z.minimum(1))),
  title: z.optional(z.string().check(z.minLength(3), z.maxLength(256))),
  description: z.optional(z.string().check(z.minLength(10), z.maxLength(5000))),
  status: z.optional(feedbackStatusValidator),
  category: z.optional(feedbackCategoryValidator),
});
