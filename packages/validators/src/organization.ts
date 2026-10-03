import { Effect, Result, Schema } from "effect";

const boolean = (value: boolean) =>
  Schema.Boolean.pipe(Schema.withDecodingDefaultKey(Effect.succeed(value)));
const strings = Schema.mutable(Schema.Array(Schema.String)).pipe(
  Schema.withDecodingDefaultKey(Effect.sync(() => []))
);
const hex = Schema.String.check(Schema.isPattern(/^#[0-9A-Fa-f]{6}$/));
const publicAccess = Schema.Struct({
  allowAnonymousSubmissions: boolean(false),
  allowAnonymousVoting: boolean(true),
  allowAnonymousComments: boolean(false),
  requireApproval: boolean(false),
});
const branding = Schema.Struct({
  primaryColor: Schema.optionalKey(hex),
  accentColor: Schema.optionalKey(hex),
  logoUrl: Schema.optionalKey(Schema.String),
  faviconUrl: Schema.optionalKey(Schema.String),
});
const feedback = Schema.Struct({
  enableRoadmap: boolean(true),
  enableDigestEmails: boolean(false),
  boards: strings,
  tags: strings,
});
const changelog = Schema.Struct({ enabled: boolean(false), tags: strings });
const domain = Schema.Struct({
  customDomain: Schema.optionalKey(Schema.String),
  domainVerified: boolean(false),
});
export const organizationSettingsSchema = Schema.Struct({
  publicAccess: publicAccess.pipe(
    Schema.withDecodingDefaultKey(
      Effect.succeed({
        allowAnonymousSubmissions: false,
        allowAnonymousVoting: true,
        allowAnonymousComments: false,
        requireApproval: false,
      })
    )
  ),
  branding: branding.pipe(Schema.withDecodingDefaultKey(Effect.succeed({}))),
  feedback: feedback.pipe(
    Schema.withDecodingDefaultKey(
      Effect.sync(() => ({
        enableRoadmap: true,
        enableDigestEmails: false,
        boards: [],
        tags: [],
      }))
    )
  ),
  changelog: changelog.pipe(
    Schema.withDecodingDefaultKey(
      Effect.sync(() => ({ enabled: false, tags: [] }))
    )
  ),
  domain: domain.pipe(
    Schema.withDecodingDefaultKey(Effect.succeed({ domainVerified: false }))
  ),
});
export type OrganizationSettings = Schema.Schema.Type<
  typeof organizationSettingsSchema
>;
const decodeSettings = Schema.decodeUnknownResult(organizationSettingsSchema);
export function parseOrganizationSettings(
  metadata: string | null
): OrganizationSettings {
  let value: unknown = {};
  if (metadata) {
    try {
      value = JSON.parse(metadata);
    } catch {
      value = {};
    }
  }
  const result = decodeSettings(value);
  return Result.isSuccess(result)
    ? result.success
    : Schema.decodeUnknownSync(organizationSettingsSchema)({});
}
export function serializeOrganizationSettings(
  settings: Partial<OrganizationSettings>
): string {
  return JSON.stringify(
    Schema.decodeUnknownSync(organizationSettingsSchema)(settings)
  );
}
export type OnboardingState = {
  createApiKey: boolean;
  installWidget: boolean;
  anonymousSubmissions: boolean;
  customizeBranding: boolean;
  shareBoard: boolean;
};
export const defaultOnboardingState: OnboardingState = {
  createApiKey: false,
  installWidget: false,
  anonymousSubmissions: false,
  customizeBranding: false,
  shareBoard: false,
};
