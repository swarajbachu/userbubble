import { z } from "zod";

/**
 * Organization settings schema for public access control and branding
 * Stored in organization.metadata JSON field
 */
const publicAccessSchema = z.object({
  // Allow anonymous users to submit feedback
  allowAnonymousSubmissions: z.boolean().default(false),
  // Allow anonymous users to vote on feedback
  allowAnonymousVoting: z.boolean().default(true),
  // Allow anonymous users to comment on feedback
  allowAnonymousComments: z.boolean().default(false),
  // Require admin approval for anonymous posts (future feature)
  requireApproval: z.boolean().default(false),
});

const brandingSchema = z.object({
  // Primary brand color (hex format)
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  // Accent color (hex format)
  accentColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  // Logo URL for external portal
  logoUrl: z.string().optional(),
  // Favicon URL for external portal
  faviconUrl: z.string().optional(),
});

export const organizationSettingsSchema = z.object({
  publicAccess: publicAccessSchema.optional().default({
    allowAnonymousSubmissions: false,
    allowAnonymousVoting: true,
    allowAnonymousComments: false,
    requireApproval: false,
  }),
  branding: brandingSchema.optional().default({}),
});

export type OrganizationSettings = z.infer<typeof organizationSettingsSchema>;

/**
 * Parse organization metadata safely with defaults
 */
export function parseOrganizationSettings(
  metadata: string | null
): OrganizationSettings {
  if (!metadata) {
    return organizationSettingsSchema.parse({});
  }

  try {
    const parsed = JSON.parse(metadata);
    return organizationSettingsSchema.parse(parsed);
  } catch {
    // If parsing fails, return default settings
    return organizationSettingsSchema.parse({});
  }
}

/**
 * Serialize organization settings to JSON string
 */
export function serializeOrganizationSettings(
  settings: Partial<OrganizationSettings>
): string {
  const validated = organizationSettingsSchema.parse(settings);
  return JSON.stringify(validated);
}
