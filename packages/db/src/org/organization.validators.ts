import { z } from "zod";
import { isReservedSlug, isValidSlug } from "../lib/slug";
import { invitationStatuses, roles } from "./organization.sql";

export const roleValidator = z.enum(roles);
export const invitationStatusValidator = z.enum(invitationStatuses);

/**
 * Validator for creating a new organization
 */
export const createOrganizationValidator = z.object({
  name: z
    .string()
    .min(3, "Organization name must be at least 3 characters")
    .max(100, "Organization name must be less than 100 characters")
    .trim(),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .max(50, "Slug must be less than 50 characters")
    .toLowerCase()
    .refine(isValidSlug, {
      message: "Slug can only contain lowercase letters, numbers, and hyphens",
    })
    .refine((slug) => !isReservedSlug(slug), {
      message: "This slug is reserved and cannot be used",
    }),
  website: z.string().url("Must be a valid URL").optional(),
});

export type CreateOrganizationInput = z.infer<
  typeof createOrganizationValidator
>;
