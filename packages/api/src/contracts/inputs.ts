import { isReservedSlug, isValidSlug } from "@userbubble/validators";
import {
  feedbackCategories,
  feedbackStatuses,
} from "@userbubble/validators/feedback-model";
import { Effect, Schema, SchemaTransformation } from "effect";

// No-argument calls still require an object envelope, including transport metadata.
export const EmptyInput = Schema.Record(Schema.String, Schema.Unknown);
export const UpdateProfileInput = Schema.Struct({
  name: Schema.optionalKey(
    Schema.Trim.check(Schema.isMinLength(1), Schema.isMaxLength(100))
  ),
  image: Schema.optionalKey(
    Schema.NullOr(
      Schema.String.check(
        Schema.makeFilter((value) => {
          try {
            return ["http:", "https:"].includes(new URL(value).protocol);
          } catch {
            return false;
          }
        })
      )
    )
  ),
}).check(
  Schema.makeFilter(
    (input) => input.name !== undefined || input.image !== undefined
  )
);

export const ResourceId = Schema.String.check(Schema.isMinLength(1));
export const OrganizationInput = Schema.Struct({ organizationId: ResourceId });
export const RevokeConnectionInput = Schema.Struct({ agentId: ResourceId });
export const RevokeOAuthInput = Schema.Struct({ consentId: ResourceId });
export const ReferenceListInput = Schema.Struct({
  ...OrganizationInput.fields,
  postId: ResourceId,
});
export const ReferenceDeleteInput = Schema.Struct({
  ...OrganizationInput.fields,
  id: ResourceId,
});
export const ReferenceAddInput = Schema.Struct({
  ...ReferenceListInput.fields,
  url: Schema.String.check(
    Schema.isPattern(/^https?:\/\//),
    Schema.makeFilter((value) => {
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    })
  ),
  title: Schema.Trim.check(Schema.isMinLength(1), Schema.isMaxLength(200)),
});

export const MemberListInput = Schema.Struct({
  ...OrganizationInput.fields,
  search: Schema.optionalKey(Schema.String),
});
export const MemberRemoveInput = Schema.Struct({
  ...OrganizationInput.fields,
  memberId: ResourceId,
});
export const MemberRoleInput = Schema.Struct({
  ...MemberRemoveInput.fields,
  role: Schema.Literals(["owner", "admin", "member"]),
});
export const OrganizationDeleteInput = Schema.Struct({
  ...OrganizationInput.fields,
  confirmationName: Schema.String,
});
export const CancelInvitationInput = Schema.Struct({
  ...OrganizationInput.fields,
  invitationId: ResourceId,
});
export const OnboardingInput = Schema.Struct({
  ...OrganizationInput.fields,
  steps: Schema.Struct({
    createApiKey: Schema.optionalKey(Schema.Boolean),
    installWidget: Schema.optionalKey(Schema.Boolean),
    anonymousSubmissions: Schema.optionalKey(Schema.Boolean),
    customizeBranding: Schema.optionalKey(Schema.Boolean),
    shareBoard: Schema.optionalKey(Schema.Boolean),
  }),
});

const ApiKeyName = Schema.Trim.check(
  Schema.isMinLength(1),
  Schema.isMaxLength(50)
);
const ApiKeyDescription = Schema.String.check(Schema.isMaxLength(200));
export const ApiKeyIdInput = Schema.Struct({ id: ResourceId });
export const ApiKeyCreateInput = Schema.Struct({
  ...OrganizationInput.fields,
  name: ApiKeyName,
  description: Schema.optionalKey(ApiKeyDescription),
  expiresAt: Schema.optionalKey(
    Schema.NullOr(
      Schema.Union([Schema.Date, Schema.DateFromString, Schema.DateFromMillis])
    )
  ),
});
export const ApiKeyUpdateInput = Schema.Struct({
  ...ApiKeyIdInput.fields,
  name: Schema.optionalKey(ApiKeyName),
  description: Schema.optionalKey(Schema.NullOr(ApiKeyDescription)),
});
export const ApiKeyToggleInput = Schema.Struct({
  ...ApiKeyIdInput.fields,
  isActive: Schema.Boolean,
});

const OrganizationSlug = Schema.String.check(
  Schema.isMinLength(3),
  Schema.isMaxLength(50)
).pipe(
  Schema.decodeTo(
    Schema.String.check(
      Schema.makeFilter(isValidSlug),
      Schema.makeFilter((slug) => !isReservedSlug(slug))
    ),
    SchemaTransformation.transform({
      decode: (slug) => slug.toLowerCase(),
      encode: (slug) => slug,
    })
  )
);
const UrlInput = Schema.String.check(
  Schema.makeFilter((value) => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  })
);
export const OrganizationSlugInput = Schema.Struct({ slug: OrganizationSlug });
export const OrganizationCreateInput = Schema.Struct({
  ...OrganizationSlugInput.fields,
  name: Schema.Trim.check(Schema.isMinLength(3), Schema.isMaxLength(100)),
  website: Schema.optionalKey(UrlInput),
});
export const OrganizationUpdateInput = Schema.Struct({
  expectedRevision: Schema.optionalKey(
    Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(1))
  ),
  ...OrganizationInput.fields,
  name: Schema.optionalKey(
    Schema.Trim.check(Schema.isMinLength(1), Schema.isMaxLength(100))
  ),
  logo: Schema.optionalKey(Schema.NullOr(UrlInput)),
  website: Schema.optionalKey(Schema.NullOr(UrlInput)),
});
export const OrganizationInviteInput = Schema.Struct({
  ...OrganizationInput.fields,
  email: Schema.String.check(
    Schema.isPattern(
      /^(?:[A-Za-z0-9_'+-]+\.)*[A-Za-z0-9_'+-]*[A-Za-z0-9_+-]@(?:[A-Za-z0-9][A-Za-z0-9-]*\.)+[A-Za-z]{2,}$/
    )
  ),
  role: Schema.Literals(["admin", "member"]).pipe(
    Schema.withDecodingDefaultKey(Effect.succeed("member"))
  ),
});

// Dates remain native inside the application and use offset-qualified ISO strings over JSON.
const IsoDateString = Schema.String.check(
  Schema.isPattern(
    /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d+)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/
  ),
  Schema.makeFilter((value) => {
    const [year, month, day] = value.slice(0, 10).split("-").map(Number);
    if (!(year !== undefined && month && day)) {
      return false;
    }
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return day <= (days[month - 1] ?? 0);
  })
);
const ReleaseDate = Schema.Union([
  Schema.Date,
  IsoDateString.pipe(
    Schema.decodeTo(Schema.Date, SchemaTransformation.dateFromString)
  ),
]);
export const ChangelogListInput = Schema.Struct({
  ...OrganizationInput.fields,
  published: Schema.optionalKey(Schema.Boolean),
  tags: Schema.optionalKey(Schema.Array(Schema.String)),
  dateFrom: Schema.optionalKey(ReleaseDate),
  dateTo: Schema.optionalKey(ReleaseDate),
  limit: Schema.optionalKey(
    Schema.Number.check(
      Schema.isInt(),
      Schema.isBetween({ minimum: 1, maximum: 100 })
    )
  ),
  offset: Schema.optionalKey(
    Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(0))
  ),
}).check(
  Schema.makeFilter(
    ({ dateFrom, dateTo }) => !(dateFrom && dateTo) || dateFrom <= dateTo
  )
);
export const ChangelogDetailInput = Schema.Struct({
  id: ResourceId,
  organizationId: Schema.optionalKey(ResourceId),
});
export const ChangelogIdInput = Schema.Struct({
  expectedRevision: Schema.optionalKey(
    Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(1))
  ),
  ...OrganizationInput.fields,
  id: ResourceId,
});
export const ChangelogCreateInput = Schema.Struct({
  ...OrganizationInput.fields,
  title: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(256)),
  description: Schema.String.check(Schema.isMinLength(1)),
  version: Schema.optionalKey(Schema.String),
  coverImageUrl: Schema.optionalKey(UrlInput),
  tags: Schema.optionalKey(Schema.Array(Schema.String)),
  isPublished: Schema.Boolean.pipe(
    Schema.withDecodingDefaultKey(Effect.succeed(false))
  ),
  feedbackPostIds: Schema.optionalKey(Schema.Array(ResourceId)),
});
export const ChangelogUpdateInput = Schema.Struct({
  ...ChangelogIdInput.fields,
  title: Schema.optionalKey(
    Schema.Trim.check(Schema.isMinLength(1), Schema.isMaxLength(256))
  ),
  description: Schema.optionalKey(Schema.String.check(Schema.isMinLength(1))),
  version: Schema.optionalKey(Schema.NullOr(Schema.String)),
  coverImageUrl: Schema.optionalKey(Schema.NullOr(UrlInput)),
  tags: Schema.optionalKey(Schema.Array(Schema.String)),
  feedbackPostIds: Schema.optionalKey(Schema.Array(ResourceId)),
  publish: Schema.optionalKey(Schema.Boolean),
});
export const ChangelogFeedbackInput = Schema.Struct({
  expectedRevision: Schema.optionalKey(
    Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(1))
  ),
  ...OrganizationInput.fields,
  entryId: ResourceId,
  feedbackPostIds: Schema.Array(ResourceId),
});

const BrandColor = Schema.String.check(Schema.isPattern(/^#[0-9A-Fa-f]{6}$/));
export const SettingsUpdateInput = Schema.Struct({
  expectedRevision: Schema.optionalKey(
    Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(1))
  ),
  ...OrganizationInput.fields,
  settings: Schema.Struct({
    publicAccess: Schema.optionalKey(
      Schema.Struct({
        allowAnonymousSubmissions: Schema.optionalKey(Schema.Boolean),
        allowAnonymousVoting: Schema.optionalKey(Schema.Boolean),
        allowAnonymousComments: Schema.optionalKey(Schema.Boolean),
        requireApproval: Schema.optionalKey(Schema.Boolean),
      })
    ),
    branding: Schema.optionalKey(
      Schema.Struct({
        primaryColor: Schema.optionalKey(BrandColor),
        accentColor: Schema.optionalKey(BrandColor),
        logoUrl: Schema.optionalKey(Schema.String),
        faviconUrl: Schema.optionalKey(Schema.String),
      })
    ),
    feedback: Schema.optionalKey(
      Schema.Struct({
        enableRoadmap: Schema.optionalKey(Schema.Boolean),
        enableDigestEmails: Schema.optionalKey(Schema.Boolean),
        boards: Schema.optionalKey(Schema.Array(Schema.String)),
        tags: Schema.optionalKey(Schema.Array(Schema.String)),
      })
    ),
    changelog: Schema.optionalKey(
      Schema.Struct({
        enabled: Schema.optionalKey(Schema.Boolean),
        tags: Schema.optionalKey(Schema.Array(Schema.String)),
      })
    ),
    domain: Schema.optionalKey(
      Schema.Struct({
        customDomain: Schema.optionalKey(Schema.String),
        domainVerified: Schema.optionalKey(Schema.Boolean),
      })
    ),
  }),
});

const FeedbackStatus = Schema.Literals(feedbackStatuses);
const FeedbackCategory = Schema.Literals(feedbackCategories);
const FeedbackTimestamp = IsoDateString.check(Schema.isPattern(/Z$/));
const Revision = Schema.Number.check(
  Schema.isInt(),
  Schema.isGreaterThanOrEqualTo(1)
);
const FeedbackTitle = Schema.String.check(
  Schema.isMinLength(3),
  Schema.isMaxLength(256)
);
const FeedbackDescription = Schema.String.check(
  Schema.isMinLength(10),
  Schema.isMaxLength(5000)
);
export const FeedbackIdInput = Schema.Struct({ id: ResourceId });
export const FeedbackPostInput = Schema.Struct({ postId: ResourceId });
export const FeedbackSearchInput = Schema.Struct({
  ...OrganizationInput.fields,
  query: Schema.optionalKey(Schema.String.check(Schema.isMaxLength(200))),
  status: Schema.optionalKey(Schema.Array(FeedbackStatus)),
  category: Schema.optionalKey(FeedbackCategory),
  updatedSince: Schema.optionalKey(FeedbackTimestamp),
  cursor: Schema.optionalKey(
    Schema.Struct({ updatedAt: FeedbackTimestamp, id: ResourceId })
  ),
  limit: Schema.Number.check(
    Schema.isInt(),
    Schema.isBetween({ minimum: 1, maximum: 100 })
  ).pipe(Schema.withDecodingDefaultKey(Effect.succeed(50))),
});
export const FeedbackListInput = Schema.Struct({
  ...OrganizationInput.fields,
  status: Schema.optionalKey(Schema.Array(FeedbackStatus)),
  category: Schema.optionalKey(FeedbackCategory),
  sortBy: Schema.optionalKey(Schema.Literals(["votes", "recent"])),
});
export const FeedbackCreateInput = Schema.Struct({
  ...OrganizationInput.fields,
  title: FeedbackTitle,
  description: FeedbackDescription,
  category: FeedbackCategory,
  isPublic: Schema.optionalKey(Schema.Boolean),
});
export const FeedbackUpdateInput = Schema.Struct({
  ...FeedbackIdInput.fields,
  expectedRevision: Schema.optionalKey(Revision),
  title: Schema.optionalKey(FeedbackTitle),
  description: Schema.optionalKey(FeedbackDescription),
  status: Schema.optionalKey(FeedbackStatus),
  category: Schema.optionalKey(FeedbackCategory),
});
export const FeedbackVoteInput = Schema.Struct({
  ...FeedbackPostInput.fields,
  value: Schema.Literals([-1, 0, 1]),
  sessionId: Schema.optionalKey(Schema.String),
});
export const FeedbackStatusInput = Schema.Struct({
  ...OrganizationInput.fields,
  ...FeedbackPostInput.fields,
  status: FeedbackStatus,
  expectedRevision: Schema.optionalKey(Revision),
});
export const FeedbackCommentInput = Schema.Struct({
  ...FeedbackPostInput.fields,
  content: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(2000)),
  parentId: Schema.optionalKey(ResourceId),
  authorName: Schema.optionalKey(
    Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(100))
  ),
});

export const PublicIndexInput = Schema.Struct({
  ...OrganizationInput.fields,
  kind: Schema.Literals(["feedback", "changelog"]),
  page: Schema.Number.check(Schema.isInt(), Schema.isGreaterThanOrEqualTo(0)),
});
export const ApprovalInput = Schema.Struct({
  agentId: ResourceId,
  code: Schema.String.check(Schema.isMinLength(1), Schema.isMaxLength(64)),
});
export const ApprovalResponseInput = Schema.Struct({
  ...ApprovalInput.fields,
  action: Schema.Literals(["approve", "deny"]),
});
