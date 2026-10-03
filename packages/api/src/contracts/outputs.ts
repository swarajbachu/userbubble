import { Schema } from "effect";

/** Transport-safe public projections; additional repository fields are stripped. */
export const Profile = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  image: Schema.NullOr(Schema.String),
});

export const MemberRole = Schema.Literals(["owner", "admin", "member"]);
export const Success = Schema.Struct({ success: Schema.Boolean });
export const Available = Schema.Boolean;

export const Organization = Schema.Struct({
  id: Schema.String,
  name: Schema.String,
  slug: Schema.String,
  logo: Schema.NullOr(Schema.String),
  website: Schema.NullOr(Schema.String),
  metadata: Schema.NullOr(Schema.String),
  settingsRevision: Schema.Number.check(
    Schema.isInt(),
    Schema.isGreaterThanOrEqualTo(1)
  ),
  onboarding: Schema.NullOr(
    Schema.Struct({
      createApiKey: Schema.Boolean,
      installWidget: Schema.Boolean,
      anonymousSubmissions: Schema.Boolean,
      customizeBranding: Schema.Boolean,
      shareBoard: Schema.Boolean,
    })
  ),
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
}).annotate({ identifier: "Organization" });
export const Organizations = Schema.Array(
  Schema.Struct({
    ...Organization.fields,
    role: MemberRole,
  })
);

export const ApiKeySummary = Schema.Struct({
  id: Schema.String,
  organizationId: Schema.String,
  name: Schema.String,
  description: Schema.NullOr(Schema.String),
  keyPreview: Schema.String,
  isActive: Schema.Boolean,
  expiresAt: Schema.NullOr(Schema.Date),
  lastUsedAt: Schema.NullOr(Schema.Date),
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
}).annotate({ identifier: "ApiKeySummary" });
export const ApiKeys = Schema.Array(ApiKeySummary);
export const CreatedApiKey = Schema.Struct({
  apiKey: ApiKeySummary,
  rawKey: Schema.String,
});

export const Reference = Schema.Struct({
  id: Schema.String,
  organizationId: Schema.String,
  postId: Schema.String,
  url: Schema.String,
  title: Schema.String,
  authorId: Schema.NullOr(Schema.String),
  createdAt: Schema.Date,
}).annotate({ identifier: "FeedbackReference" });
export const References = Schema.Array(Reference);

export const Activity = Schema.Array(
  Schema.Struct({
    id: Schema.String,
    organizationId: Schema.NullOr(Schema.String),
    actorId: Schema.NullOr(Schema.String),
    agentId: Schema.NullOr(Schema.String),
    operation: Schema.String,
    outcome: Schema.String,
    requestId: Schema.String,
    resourceId: Schema.NullOr(Schema.String),
    createdAt: Schema.Date,
  })
);

export const Invitation = Schema.Struct({
  id: Schema.String,
  email: Schema.String,
  inviterId: Schema.String,
  organizationId: Schema.String,
  role: MemberRole,
  status: Schema.Literals(["pending", "accepted", "rejected", "cancelled"]),
  expiresAt: Schema.Date,
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
}).annotate({ identifier: "Invitation" });

export const Invitations = Schema.Array(
  Schema.Struct({
    ...Invitation.fields,
    inviter: Schema.Struct({
      id: Schema.String,
      name: Schema.String,
      email: Schema.String,
    }),
  })
);

export const Members = Schema.Array(
  Schema.Struct({
    id: Schema.String,
    userId: Schema.String,
    organizationId: Schema.String,
    role: MemberRole,
    createdAt: Schema.Date,
    updatedAt: Schema.Date,
    user: Schema.Struct({
      id: Schema.String,
      name: Schema.String,
      email: Schema.String,
      image: Schema.NullOr(Schema.String),
    }),
  })
);

export const Connections = Schema.Array(
  Schema.Struct({
    id: Schema.String,
    name: Schema.String,
    status: Schema.String,
    createdAt: Schema.Date,
    lastUsedAt: Schema.NullOr(Schema.Date),
    grants: Schema.Array(
      Schema.Struct({
        capability: Schema.String,
        status: Schema.String,
        constraints: Schema.NullOr(Schema.String),
        expiresAt: Schema.NullOr(Schema.Date),
      })
    ),
  })
);
export const OAuthConnections = Schema.Array(
  Schema.Struct({
    id: Schema.String,
    clientId: Schema.String,
    name: Schema.NullOr(Schema.String),
    organizationId: Schema.NullOr(Schema.String),
    scopes: Schema.Array(Schema.String),
    createdAt: Schema.Date,
  })
);

export const ChangelogEntry = Schema.Struct({
  revision: Schema.Number.check(
    Schema.isInt(),
    Schema.isGreaterThanOrEqualTo(1)
  ),
  id: Schema.String,
  organizationId: Schema.String,
  title: Schema.String,
  description: Schema.String,
  version: Schema.NullOr(Schema.String),
  isPublished: Schema.Boolean,
  publishedAt: Schema.NullOr(Schema.Date),
  scheduledFor: Schema.NullOr(Schema.Date),
  authorId: Schema.String,
  coverImageUrl: Schema.NullOr(Schema.String),
  tags: Schema.NullOr(Schema.Array(Schema.String)),
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
}).annotate({ identifier: "ChangelogEntry" });
export const LinkedFeedback = Schema.Struct({
  id: Schema.String,
  organizationId: Schema.String,
  title: Schema.String,
  description: Schema.String,
  status: Schema.Literals([
    "open",
    "under_review",
    "planned",
    "in_progress",
    "completed",
    "closed",
  ]),
  category: Schema.Literals([
    "feature_request",
    "bug",
    "improvement",
    "question",
    "other",
  ]),
  voteCount: Schema.Number,
  isPublic: Schema.Boolean,
});
export const ChangelogDetail = Schema.Struct({
  ...ChangelogEntry.fields,
  author: Schema.NullOr(Profile),
  linkedFeedback: Schema.Array(LinkedFeedback),
}).annotate({ identifier: "ChangelogDetail" });
export const ChangelogEntries = Schema.Array(ChangelogDetail);
export const ChangelogLinks = Schema.Array(
  Schema.Struct({
    id: Schema.String,
    changelogEntryId: Schema.String,
    feedbackPostId: Schema.String,
    createdAt: Schema.Date,
  })
);

export const FeedbackPost = Schema.Struct({
  ...LinkedFeedback.fields,
  authorId: Schema.NullOr(Schema.String),
  revision: Schema.Number,
  createdAt: Schema.Date,
  updatedAt: Schema.Date,
}).annotate({ identifier: "FeedbackPost" });
export const FeedbackDetail = Schema.Struct({
  post: FeedbackPost,
  author: Schema.NullOr(Profile),
});
export const FeedbackList = Schema.Array(
  Schema.Struct({
    post: FeedbackPost,
    author: Schema.NullOr(
      Schema.Struct({
        name: Schema.String,
        image: Schema.NullOr(Schema.String),
      })
    ),
    hasUserVoted: Schema.Boolean,
  })
);
export const FeedbackPage = Schema.Struct({
  items: Schema.Array(FeedbackDetail),
  nextCursor: Schema.NullOr(
    Schema.Struct({ updatedAt: Schema.String, id: Schema.String })
  ),
});
export const CommentDetail = Schema.Struct({
  comment: Schema.Struct({
    id: Schema.String,
    postId: Schema.String,
    authorId: Schema.NullOr(Schema.String),
    authorName: Schema.NullOr(Schema.String),
    content: Schema.String,
    isAiGenerated: Schema.Boolean,
    parentId: Schema.NullOr(Schema.String),
    createdAt: Schema.Date,
    updatedAt: Schema.Date,
  }),
  author: Schema.NullOr(Profile),
  isTeamMember: Schema.Boolean,
});
export const Comments = Schema.Array(CommentDetail);
