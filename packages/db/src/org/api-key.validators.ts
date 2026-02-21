import { z } from "zod";

/**
 * Validator for creating API key
 */
export const createApiKeyValidator = z.object({
  organizationId: z.string().min(1),
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must be less than 50 characters")
    .trim(),
  description: z
    .string()
    .max(200, "Description must be less than 200 characters")
    .optional(),
  expiresAt: z.coerce.date().optional().nullable(),
});

/**
 * Validator for updating API key
 */
export const updateApiKeyValidator = z.object({
  id: z.string(),
  name: z
    .string()
    .min(1, "Name is required")
    .max(50, "Name must be less than 50 characters")
    .trim()
    .optional(),
  description: z
    .string()
    .max(200, "Description must be less than 200 characters")
    .optional()
    .nullable(),
});

/**
 * Validator for toggling key status
 */
export const toggleApiKeyValidator = z.object({
  id: z.string(),
  isActive: z.boolean(),
});

export type CreateApiKeyInput = z.infer<typeof createApiKeyValidator>;
export type UpdateApiKeyInput = z.infer<typeof updateApiKeyValidator>;
export type ToggleApiKeyInput = z.infer<typeof toggleApiKeyValidator>;
