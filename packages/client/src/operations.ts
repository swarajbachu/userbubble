/** Generated from the Effect operation catalog. Run pnpm client:generate. */

/** biome-ignore-all lint/style/noNamespace lint/style/useConsistentTypeDefinitions: generated type-only namespaces isolate schema definitions */

export namespace account_getProfile_Input {
  export interface Input {
    [k: string]: unknown;
  }
}

export namespace account_getProfile_Output {
  export interface Output {
    id: string;
    name: string;
    image: string | null;
  }
}

export namespace account_updateProfile_Input {
  export interface Input {
    name?: string;
    image?: string | null;
  }
}

export namespace account_updateProfile_Output {
  export interface Output {
    id: string;
    name: string;
    image: string | null;
  }
}

export namespace connection_listOAuth_Input {
  export interface Input {
    [k: string]: unknown;
  }
}

export namespace connection_listOAuth_Output {
  export type Output = {
    id: string;
    clientId: string;
    name: string | null;
    organizationId: string | null;
    scopes: string[];
    createdAt: string;
  }[];
}

export namespace connection_revokeOAuth_Input {
  export interface Input {
    consentId: string;
  }
}

export namespace connection_revokeOAuth_Output {
  export interface Output {
    success: boolean;
  }
}

export namespace connection_list_Input {
  export interface Input {
    [k: string]: unknown;
  }
}

export namespace connection_list_Output {
  export type Output = {
    id: string;
    name: string;
    status: string;
    createdAt: string;
    lastUsedAt: string | null;
    grants: {
      capability: string;
      status: string;
      constraints: string | null;
      expiresAt: string | null;
    }[];
  }[];
}

export namespace connection_revoke_Input {
  export interface Input {
    agentId: string;
  }
}

export namespace connection_revoke_Output {
  export interface Output {
    success: boolean;
  }
}

export namespace reference_list_Input {
  export interface Input {
    organizationId: string;
    postId: string;
  }
}

export namespace reference_list_Output {
  export type Output = FeedbackReference[];

  export interface FeedbackReference {
    id: string;
    organizationId: string;
    postId: string;
    url: string;
    title: string;
    authorId: string | null;
    createdAt: string;
  }
}

export namespace reference_add_Input {
  export interface Input {
    organizationId: string;
    postId: string;
    url: string;
    title: string;
  }
}

export namespace reference_add_Output {
  export interface Output {
    id: string;
    organizationId: string;
    postId: string;
    url: string;
    title: string;
    authorId: string | null;
    createdAt: string;
  }
}

export namespace reference_delete_Input {
  export interface Input {
    organizationId: string;
    id: string;
  }
}

export namespace reference_delete_Output {
  export interface Output {
    success: boolean;
  }
}

export namespace activity_list_Input {
  export interface Input {
    organizationId: string;
  }
}

export namespace activity_list_Output {
  export type Output = {
    id: string;
    organizationId: string | null;
    actorId: string | null;
    agentId: string | null;
    operation: string;
    outcome: string;
    requestId: string;
    resourceId: string | null;
    createdAt: string;
  }[];
}

export namespace feedback_search_Input {
  export interface Input {
    organizationId: string;
    query?: string;
    status?: (
      | "open"
      | "under_review"
      | "planned"
      | "in_progress"
      | "completed"
      | "closed"
    )[];
    category?: "feature_request" | "bug" | "improvement" | "question" | "other";
    updatedSince?: string;
    cursor?: {
      updatedAt: string;
      id: string;
    };
    limit?: number;
  }
}

export namespace feedback_search_Output {
  export interface Output {
    items: {
      post: FeedbackPost;
      author: {
        id: string;
        name: string;
        image: string | null;
      } | null;
    }[];
    nextCursor: {
      updatedAt: string;
      id: string;
    } | null;
  }
  export interface FeedbackPost {
    id: string;
    organizationId: string;
    title: string;
    description: string;
    status:
      | "open"
      | "under_review"
      | "planned"
      | "in_progress"
      | "completed"
      | "closed";
    category: "feature_request" | "bug" | "improvement" | "question" | "other";
    voteCount: number | ("Infinity" | "-Infinity" | "NaN");
    isPublic: boolean;
    authorId: string | null;
    revision: number | ("Infinity" | "-Infinity" | "NaN");
    createdAt: string;
    updatedAt: string;
  }
}

export namespace feedback_getAll_Input {
  export interface Input {
    organizationId: string;
    status?: (
      | "open"
      | "under_review"
      | "planned"
      | "in_progress"
      | "completed"
      | "closed"
    )[];
    category?: "feature_request" | "bug" | "improvement" | "question" | "other";
    sortBy?: "votes" | "recent";
  }
}

export namespace feedback_getAll_Output {
  export type Output = {
    post: FeedbackPost;
    author: {
      name: string;
      image: string | null;
    } | null;
    hasUserVoted: boolean;
  }[];

  export interface FeedbackPost {
    id: string;
    organizationId: string;
    title: string;
    description: string;
    status:
      | "open"
      | "under_review"
      | "planned"
      | "in_progress"
      | "completed"
      | "closed";
    category: "feature_request" | "bug" | "improvement" | "question" | "other";
    voteCount: number | ("Infinity" | "-Infinity" | "NaN");
    isPublic: boolean;
    authorId: string | null;
    revision: number | ("Infinity" | "-Infinity" | "NaN");
    createdAt: string;
    updatedAt: string;
  }
}

export namespace feedback_getById_Input {
  export interface Input {
    id: string;
  }
}

export namespace feedback_getById_Output {
  export interface Output {
    post: FeedbackPost;
    author: {
      id: string;
      name: string;
      image: string | null;
    } | null;
  }
  export interface FeedbackPost {
    id: string;
    organizationId: string;
    title: string;
    description: string;
    status:
      | "open"
      | "under_review"
      | "planned"
      | "in_progress"
      | "completed"
      | "closed";
    category: "feature_request" | "bug" | "improvement" | "question" | "other";
    voteCount: number | ("Infinity" | "-Infinity" | "NaN");
    isPublic: boolean;
    authorId: string | null;
    revision: number | ("Infinity" | "-Infinity" | "NaN");
    createdAt: string;
    updatedAt: string;
  }
}

export namespace feedback_create_Input {
  export interface Input {
    organizationId: string;
    title: string;
    description: string;
    category: "feature_request" | "bug" | "improvement" | "question" | "other";
    isPublic?: boolean;
  }
}

export namespace feedback_create_Output {
  export interface Output {
    id: string;
    organizationId: string;
    title: string;
    description: string;
    status:
      | "open"
      | "under_review"
      | "planned"
      | "in_progress"
      | "completed"
      | "closed";
    category: "feature_request" | "bug" | "improvement" | "question" | "other";
    voteCount: number | ("Infinity" | "-Infinity" | "NaN");
    isPublic: boolean;
    authorId: string | null;
    revision: number | ("Infinity" | "-Infinity" | "NaN");
    createdAt: string;
    updatedAt: string;
  }
}

export namespace feedback_update_Input {
  export interface Input {
    id: string;
    expectedRevision?: number;
    title?: string;
    description?: string;
    status?:
      | "open"
      | "under_review"
      | "planned"
      | "in_progress"
      | "completed"
      | "closed";
    category?: "feature_request" | "bug" | "improvement" | "question" | "other";
  }
}

export namespace feedback_update_Output {
  export interface Output {
    id: string;
    organizationId: string;
    title: string;
    description: string;
    status:
      | "open"
      | "under_review"
      | "planned"
      | "in_progress"
      | "completed"
      | "closed";
    category: "feature_request" | "bug" | "improvement" | "question" | "other";
    voteCount: number | ("Infinity" | "-Infinity" | "NaN");
    isPublic: boolean;
    authorId: string | null;
    revision: number | ("Infinity" | "-Infinity" | "NaN");
    createdAt: string;
    updatedAt: string;
  }
}

export namespace feedback_delete_Input {
  export interface Input {
    id: string;
  }
}

export namespace feedback_delete_Output {
  export interface Output {
    success: boolean;
  }
}

export namespace feedback_vote_Input {
  export interface Input {
    postId: string;
    value: -1 | 0 | 1;
    sessionId?: string;
  }
}

export namespace feedback_vote_Output {
  export interface Output {
    success: boolean;
  }
}

export namespace feedback_updateStatus_Input {
  export interface Input {
    organizationId: string;
    postId: string;
    status:
      | "open"
      | "under_review"
      | "planned"
      | "in_progress"
      | "completed"
      | "closed";
    expectedRevision?: number;
  }
}

export namespace feedback_updateStatus_Output {
  export interface Output {
    id: string;
    organizationId: string;
    title: string;
    description: string;
    status:
      | "open"
      | "under_review"
      | "planned"
      | "in_progress"
      | "completed"
      | "closed";
    category: "feature_request" | "bug" | "improvement" | "question" | "other";
    voteCount: number | ("Infinity" | "-Infinity" | "NaN");
    isPublic: boolean;
    authorId: string | null;
    revision: number | ("Infinity" | "-Infinity" | "NaN");
    createdAt: string;
    updatedAt: string;
  }
}

export namespace feedback_getComments_Input {
  export interface Input {
    postId: string;
  }
}

export namespace feedback_getComments_Output {
  export type Output = {
    comment: {
      id: string;
      postId: string;
      authorId: string | null;
      authorName: string | null;
      content: string;
      isAiGenerated: boolean;
      parentId: string | null;
      createdAt: string;
      updatedAt: string;
    };
    author: {
      id: string;
      name: string;
      image: string | null;
    } | null;
    isTeamMember: boolean;
  }[];
}

export namespace feedback_createComment_Input {
  export interface Input {
    postId: string;
    content: string;
    parentId?: string;
    authorName?: string;
  }
}

export namespace feedback_createComment_Output {
  export interface Output {
    comment: {
      id: string;
      postId: string;
      authorId: string | null;
      authorName: string | null;
      content: string;
      isAiGenerated: boolean;
      parentId: string | null;
      createdAt: string;
      updatedAt: string;
    };
    author: {
      id: string;
      name: string;
      image: string | null;
    } | null;
    isTeamMember: boolean;
  }
}

export namespace feedback_deleteComment_Input {
  export interface Input {
    id: string;
  }
}

export namespace feedback_deleteComment_Output {
  export interface Output {
    success: boolean;
  }
}

export namespace changelog_getAll_Input {
  export interface Input {
    organizationId: string;
    published?: boolean;
    tags?: string[];
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
  }
}

export namespace changelog_getAll_Output {
  export type Output = ChangelogDetail[];

  export interface ChangelogDetail {
    revision: number;
    id: string;
    organizationId: string;
    title: string;
    description: string;
    version: string | null;
    isPublished: boolean;
    publishedAt: string | null;
    scheduledFor: string | null;
    authorId: string;
    coverImageUrl: string | null;
    tags: string[] | null;
    createdAt: string;
    updatedAt: string;
    author: {
      id: string;
      name: string;
      image: string | null;
    } | null;
    linkedFeedback: {
      id: string;
      organizationId: string;
      title: string;
      description: string;
      status:
        | "open"
        | "under_review"
        | "planned"
        | "in_progress"
        | "completed"
        | "closed";
      category:
        | "feature_request"
        | "bug"
        | "improvement"
        | "question"
        | "other";
      voteCount: number | ("Infinity" | "-Infinity" | "NaN");
      isPublic: boolean;
    }[];
  }
}

export namespace changelog_getById_Input {
  export interface Input {
    id: string;
    organizationId?: string;
  }
}

export namespace changelog_getById_Output {
  export interface Output {
    revision: number;
    id: string;
    organizationId: string;
    title: string;
    description: string;
    version: string | null;
    isPublished: boolean;
    publishedAt: string | null;
    scheduledFor: string | null;
    authorId: string;
    coverImageUrl: string | null;
    tags: string[] | null;
    createdAt: string;
    updatedAt: string;
    author: {
      id: string;
      name: string;
      image: string | null;
    } | null;
    linkedFeedback: {
      id: string;
      organizationId: string;
      title: string;
      description: string;
      status:
        | "open"
        | "under_review"
        | "planned"
        | "in_progress"
        | "completed"
        | "closed";
      category:
        | "feature_request"
        | "bug"
        | "improvement"
        | "question"
        | "other";
      voteCount: number | ("Infinity" | "-Infinity" | "NaN");
      isPublic: boolean;
    }[];
  }
}

export namespace changelog_create_Input {
  export interface Input {
    organizationId: string;
    title: string;
    description: string;
    version?: string;
    coverImageUrl?: string;
    tags?: string[];
    isPublished?: boolean;
    feedbackPostIds?: string[];
  }
}

export namespace changelog_create_Output {
  export interface Output {
    revision: number;
    id: string;
    organizationId: string;
    title: string;
    description: string;
    version: string | null;
    isPublished: boolean;
    publishedAt: string | null;
    scheduledFor: string | null;
    authorId: string;
    coverImageUrl: string | null;
    tags: string[] | null;
    createdAt: string;
    updatedAt: string;
  }
}

export namespace changelog_update_Input {
  export interface Input {
    expectedRevision?: number;
    organizationId: string;
    id: string;
    title?: string;
    description?: string;
    version?: string | null;
    coverImageUrl?: string | null;
    tags?: string[];
    feedbackPostIds?: string[];
    publish?: boolean;
  }
}

export namespace changelog_update_Output {
  export interface Output {
    revision: number;
    id: string;
    organizationId: string;
    title: string;
    description: string;
    version: string | null;
    isPublished: boolean;
    publishedAt: string | null;
    scheduledFor: string | null;
    authorId: string;
    coverImageUrl: string | null;
    tags: string[] | null;
    createdAt: string;
    updatedAt: string;
  }
}

export namespace changelog_publish_Input {
  export interface Input {
    expectedRevision?: number;
    organizationId: string;
    id: string;
  }
}

export namespace changelog_publish_Output {
  export interface Output {
    revision: number;
    id: string;
    organizationId: string;
    title: string;
    description: string;
    version: string | null;
    isPublished: boolean;
    publishedAt: string | null;
    scheduledFor: string | null;
    authorId: string;
    coverImageUrl: string | null;
    tags: string[] | null;
    createdAt: string;
    updatedAt: string;
  }
}

export namespace changelog_delete_Input {
  export interface Input {
    expectedRevision?: number;
    organizationId: string;
    id: string;
  }
}

export namespace changelog_delete_Output {
  export interface Output {
    success: boolean;
  }
}

export namespace changelog_linkFeedback_Input {
  export interface Input {
    expectedRevision?: number;
    organizationId: string;
    entryId: string;
    feedbackPostIds: string[];
  }
}

export namespace changelog_linkFeedback_Output {
  export type Output = {
    id: string;
    changelogEntryId: string;
    feedbackPostId: string;
    createdAt: string;
  }[];
}

export namespace changelog_unlinkFeedback_Input {
  export interface Input {
    expectedRevision?: number;
    organizationId: string;
    entryId: string;
    feedbackPostIds: string[];
  }
}

export namespace changelog_unlinkFeedback_Output {
  export interface Output {
    success: boolean;
  }
}

export namespace settings_getMyRole_Input {
  export interface Input {
    organizationId: string;
  }
}

export namespace settings_getMyRole_Output {
  export type Output = "owner" | "admin" | "member";
}

export namespace settings_updateSettings_Input {
  export interface Input {
    expectedRevision?: number;
    organizationId: string;
    settings: {
      publicAccess?: {
        allowAnonymousSubmissions?: boolean;
        allowAnonymousVoting?: boolean;
        allowAnonymousComments?: boolean;
        requireApproval?: boolean;
      };
      branding?: {
        primaryColor?: string;
        accentColor?: string;
        logoUrl?: string;
        faviconUrl?: string;
      };
      feedback?: {
        enableRoadmap?: boolean;
        enableDigestEmails?: boolean;
        boards?: string[];
        tags?: string[];
      };
      changelog?: {
        enabled?: boolean;
        tags?: string[];
      };
      domain?: {
        customDomain?: string;
        domainVerified?: boolean;
      };
    };
  }
}

export namespace settings_updateSettings_Output {
  export interface Output {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    website: string | null;
    metadata: string | null;
    settingsRevision: number;
    onboarding: {
      createApiKey: boolean;
      installWidget: boolean;
      anonymousSubmissions: boolean;
      customizeBranding: boolean;
      shareBoard: boolean;
    } | null;
    createdAt: string;
    updatedAt: string;
  }
}

export namespace settings_listMembers_Input {
  export interface Input {
    organizationId: string;
    search?: string;
  }
}

export namespace settings_listMembers_Output {
  export type Output = {
    id: string;
    userId: string;
    organizationId: string;
    role: "owner" | "admin" | "member";
    createdAt: string;
    updatedAt: string;
    user: {
      id: string;
      name: string;
      email: string;
      image: string | null;
    };
  }[];
}

export namespace settings_updateMemberRole_Input {
  export interface Input {
    organizationId: string;
    memberId: string;
    role: "owner" | "admin" | "member";
  }
}

export namespace settings_updateMemberRole_Output {
  export interface Output {
    success: boolean;
  }
}

export namespace settings_removeMember_Input {
  export interface Input {
    organizationId: string;
    memberId: string;
  }
}

export namespace settings_removeMember_Output {
  export interface Output {
    success: boolean;
  }
}

export namespace settings_deleteOrganization_Input {
  export interface Input {
    organizationId: string;
    confirmationName: string;
  }
}

export namespace settings_deleteOrganization_Output {
  export interface Output {
    success: boolean;
  }
}

export namespace apiKey_list_Input {
  export interface Input {
    organizationId: string;
  }
}

export namespace apiKey_list_Output {
  export type Output = ApiKeySummary[];

  export interface ApiKeySummary {
    id: string;
    organizationId: string;
    name: string;
    description: string | null;
    keyPreview: string;
    isActive: boolean;
    expiresAt: string | null;
    lastUsedAt: string | null;
    createdAt: string;
    updatedAt: string;
  }
}

export namespace apiKey_create_Input {
  export interface Input {
    organizationId: string;
    name: string;
    description?: string;
    expiresAt?: (string | number) | null;
  }
}

export namespace apiKey_create_Output {
  export interface Output {
    apiKey: ApiKeySummary;
    rawKey: string;
  }
  export interface ApiKeySummary {
    id: string;
    organizationId: string;
    name: string;
    description: string | null;
    keyPreview: string;
    isActive: boolean;
    expiresAt: string | null;
    lastUsedAt: string | null;
    createdAt: string;
    updatedAt: string;
  }
}

export namespace apiKey_update_Input {
  export interface Input {
    id: string;
    name?: string;
    description?: string | null;
  }
}

export namespace apiKey_update_Output {
  export interface Output {
    id: string;
    organizationId: string;
    name: string;
    description: string | null;
    keyPreview: string;
    isActive: boolean;
    expiresAt: string | null;
    lastUsedAt: string | null;
    createdAt: string;
    updatedAt: string;
  }
}

export namespace apiKey_toggleActive_Input {
  export interface Input {
    id: string;
    isActive: boolean;
  }
}

export namespace apiKey_toggleActive_Output {
  export interface Output {
    id: string;
    organizationId: string;
    name: string;
    description: string | null;
    keyPreview: string;
    isActive: boolean;
    expiresAt: string | null;
    lastUsedAt: string | null;
    createdAt: string;
    updatedAt: string;
  }
}

export namespace apiKey_delete_Input {
  export interface Input {
    id: string;
  }
}

export namespace apiKey_delete_Output {
  export interface Output {
    success: boolean;
  }
}

export namespace organization_list_Input {
  export interface Input {
    [k: string]: unknown;
  }
}

export namespace organization_list_Output {
  export type Output = {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    website: string | null;
    metadata: string | null;
    settingsRevision: number;
    onboarding: {
      createApiKey: boolean;
      installWidget: boolean;
      anonymousSubmissions: boolean;
      customizeBranding: boolean;
      shareBoard: boolean;
    } | null;
    createdAt: string;
    updatedAt: string;
    role: "owner" | "admin" | "member";
  }[];
}

export namespace organization_get_Input {
  export interface Input {
    organizationId: string;
  }
}

export namespace organization_get_Output {
  export interface Output {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    website: string | null;
    metadata: string | null;
    settingsRevision: number;
    onboarding: {
      createApiKey: boolean;
      installWidget: boolean;
      anonymousSubmissions: boolean;
      customizeBranding: boolean;
      shareBoard: boolean;
    } | null;
    createdAt: string;
    updatedAt: string;
  }
}

export namespace organization_checkSlug_Input {
  export interface Input {
    slug: string;
  }
}

export namespace organization_checkSlug_Output {
  export type Output = boolean;
}

export namespace organization_create_Input {
  export interface Input {
    slug: string;
    name: string;
    website?: string;
  }
}

export namespace organization_create_Output {
  export interface Output {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    website: string | null;
    metadata: string | null;
    settingsRevision: number;
    onboarding: {
      createApiKey: boolean;
      installWidget: boolean;
      anonymousSubmissions: boolean;
      customizeBranding: boolean;
      shareBoard: boolean;
    } | null;
    createdAt: string;
    updatedAt: string;
  }
}

export namespace organization_update_Input {
  export interface Input {
    expectedRevision?: number;
    organizationId: string;
    name?: string;
    logo?: string | null;
    website?: string | null;
  }
}

export namespace organization_update_Output {
  export interface Output {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    website: string | null;
    metadata: string | null;
    settingsRevision: number;
    onboarding: {
      createApiKey: boolean;
      installWidget: boolean;
      anonymousSubmissions: boolean;
      customizeBranding: boolean;
      shareBoard: boolean;
    } | null;
    createdAt: string;
    updatedAt: string;
  }
}

export namespace organization_initializeOnboarding_Input {
  export interface Input {
    organizationId: string;
  }
}

export namespace organization_initializeOnboarding_Output {
  export interface Output {
    success: boolean;
  }
}

export namespace organization_updateOnboarding_Input {
  export interface Input {
    organizationId: string;
    steps: {
      createApiKey?: boolean;
      installWidget?: boolean;
      anonymousSubmissions?: boolean;
      customizeBranding?: boolean;
      shareBoard?: boolean;
    };
  }
}

export namespace organization_updateOnboarding_Output {
  export interface Output {
    success: boolean;
  }
}

export namespace organization_listInvitations_Input {
  export interface Input {
    organizationId: string;
  }
}

export namespace organization_listInvitations_Output {
  export type Output = {
    id: string;
    email: string;
    inviterId: string;
    organizationId: string;
    role: "owner" | "admin" | "member";
    status: "pending" | "accepted" | "rejected" | "cancelled";
    expiresAt: string;
    createdAt: string;
    updatedAt: string;
    inviter: {
      id: string;
      name: string;
      email: string;
    };
  }[];
}

export namespace organization_invite_Input {
  export interface Input {
    organizationId: string;
    email: string;
    role?: "admin" | "member";
  }
}

export namespace organization_invite_Output {
  export interface Output {
    id: string;
    email: string;
    inviterId: string;
    organizationId: string;
    role: "owner" | "admin" | "member";
    status: "pending" | "accepted" | "rejected" | "cancelled";
    expiresAt: string;
    createdAt: string;
    updatedAt: string;
  }
}

export namespace organization_cancelInvitation_Input {
  export interface Input {
    organizationId: string;
    invitationId: string;
  }
}

export namespace organization_cancelInvitation_Output {
  export interface Output {
    id: string;
    email: string;
    inviterId: string;
    organizationId: string;
    role: "owner" | "admin" | "member";
    status: "pending" | "accepted" | "rejected" | "cancelled";
    expiresAt: string;
    createdAt: string;
    updatedAt: string;
  }
}

export interface OperationTypes {
  "account.getProfile": {
    input: account_getProfile_Input.Input;
    output: account_getProfile_Output.Output;
    supportsIdempotency: false;
  };
  "account.updateProfile": {
    input: account_updateProfile_Input.Input;
    output: account_updateProfile_Output.Output;
    supportsIdempotency: true;
  };
  "connection.listOAuth": {
    input: connection_listOAuth_Input.Input;
    output: connection_listOAuth_Output.Output;
    supportsIdempotency: false;
  };
  "connection.revokeOAuth": {
    input: connection_revokeOAuth_Input.Input;
    output: connection_revokeOAuth_Output.Output;
    supportsIdempotency: true;
  };
  "connection.list": {
    input: connection_list_Input.Input;
    output: connection_list_Output.Output;
    supportsIdempotency: false;
  };
  "connection.revoke": {
    input: connection_revoke_Input.Input;
    output: connection_revoke_Output.Output;
    supportsIdempotency: true;
  };
  "reference.list": {
    input: reference_list_Input.Input;
    output: reference_list_Output.Output;
    supportsIdempotency: false;
  };
  "reference.add": {
    input: reference_add_Input.Input;
    output: reference_add_Output.Output;
    supportsIdempotency: true;
  };
  "reference.delete": {
    input: reference_delete_Input.Input;
    output: reference_delete_Output.Output;
    supportsIdempotency: true;
  };
  "activity.list": {
    input: activity_list_Input.Input;
    output: activity_list_Output.Output;
    supportsIdempotency: false;
  };
  "feedback.search": {
    input: feedback_search_Input.Input;
    output: feedback_search_Output.Output;
    supportsIdempotency: false;
  };
  "feedback.getAll": {
    input: feedback_getAll_Input.Input;
    output: feedback_getAll_Output.Output;
    supportsIdempotency: false;
  };
  "feedback.getById": {
    input: feedback_getById_Input.Input;
    output: feedback_getById_Output.Output;
    supportsIdempotency: false;
  };
  "feedback.create": {
    input: feedback_create_Input.Input;
    output: feedback_create_Output.Output;
    supportsIdempotency: true;
  };
  "feedback.update": {
    input: feedback_update_Input.Input;
    output: feedback_update_Output.Output;
    supportsIdempotency: true;
  };
  "feedback.delete": {
    input: feedback_delete_Input.Input;
    output: feedback_delete_Output.Output;
    supportsIdempotency: true;
  };
  "feedback.vote": {
    input: feedback_vote_Input.Input;
    output: feedback_vote_Output.Output;
    supportsIdempotency: true;
  };
  "feedback.updateStatus": {
    input: feedback_updateStatus_Input.Input;
    output: feedback_updateStatus_Output.Output;
    supportsIdempotency: true;
  };
  "feedback.getComments": {
    input: feedback_getComments_Input.Input;
    output: feedback_getComments_Output.Output;
    supportsIdempotency: false;
  };
  "feedback.createComment": {
    input: feedback_createComment_Input.Input;
    output: feedback_createComment_Output.Output;
    supportsIdempotency: true;
  };
  "feedback.deleteComment": {
    input: feedback_deleteComment_Input.Input;
    output: feedback_deleteComment_Output.Output;
    supportsIdempotency: true;
  };
  "changelog.getAll": {
    input: changelog_getAll_Input.Input;
    output: changelog_getAll_Output.Output;
    supportsIdempotency: false;
  };
  "changelog.getById": {
    input: changelog_getById_Input.Input;
    output: changelog_getById_Output.Output;
    supportsIdempotency: false;
  };
  "changelog.create": {
    input: changelog_create_Input.Input;
    output: changelog_create_Output.Output;
    supportsIdempotency: true;
  };
  "changelog.update": {
    input: changelog_update_Input.Input;
    output: changelog_update_Output.Output;
    supportsIdempotency: true;
  };
  "changelog.publish": {
    input: changelog_publish_Input.Input;
    output: changelog_publish_Output.Output;
    supportsIdempotency: true;
  };
  "changelog.delete": {
    input: changelog_delete_Input.Input;
    output: changelog_delete_Output.Output;
    supportsIdempotency: true;
  };
  "changelog.linkFeedback": {
    input: changelog_linkFeedback_Input.Input;
    output: changelog_linkFeedback_Output.Output;
    supportsIdempotency: true;
  };
  "changelog.unlinkFeedback": {
    input: changelog_unlinkFeedback_Input.Input;
    output: changelog_unlinkFeedback_Output.Output;
    supportsIdempotency: true;
  };
  "settings.getMyRole": {
    input: settings_getMyRole_Input.Input;
    output: settings_getMyRole_Output.Output;
    supportsIdempotency: false;
  };
  "settings.updateSettings": {
    input: settings_updateSettings_Input.Input;
    output: settings_updateSettings_Output.Output;
    supportsIdempotency: true;
  };
  "settings.listMembers": {
    input: settings_listMembers_Input.Input;
    output: settings_listMembers_Output.Output;
    supportsIdempotency: false;
  };
  "settings.updateMemberRole": {
    input: settings_updateMemberRole_Input.Input;
    output: settings_updateMemberRole_Output.Output;
    supportsIdempotency: true;
  };
  "settings.removeMember": {
    input: settings_removeMember_Input.Input;
    output: settings_removeMember_Output.Output;
    supportsIdempotency: true;
  };
  "settings.deleteOrganization": {
    input: settings_deleteOrganization_Input.Input;
    output: settings_deleteOrganization_Output.Output;
    supportsIdempotency: true;
  };
  "apiKey.list": {
    input: apiKey_list_Input.Input;
    output: apiKey_list_Output.Output;
    supportsIdempotency: false;
  };
  "apiKey.create": {
    input: apiKey_create_Input.Input;
    output: apiKey_create_Output.Output;
    supportsIdempotency: false;
  };
  "apiKey.update": {
    input: apiKey_update_Input.Input;
    output: apiKey_update_Output.Output;
    supportsIdempotency: false;
  };
  "apiKey.toggleActive": {
    input: apiKey_toggleActive_Input.Input;
    output: apiKey_toggleActive_Output.Output;
    supportsIdempotency: false;
  };
  "apiKey.delete": {
    input: apiKey_delete_Input.Input;
    output: apiKey_delete_Output.Output;
    supportsIdempotency: false;
  };
  "organization.list": {
    input: organization_list_Input.Input;
    output: organization_list_Output.Output;
    supportsIdempotency: false;
  };
  "organization.get": {
    input: organization_get_Input.Input;
    output: organization_get_Output.Output;
    supportsIdempotency: false;
  };
  "organization.checkSlug": {
    input: organization_checkSlug_Input.Input;
    output: organization_checkSlug_Output.Output;
    supportsIdempotency: false;
  };
  "organization.create": {
    input: organization_create_Input.Input;
    output: organization_create_Output.Output;
    supportsIdempotency: true;
  };
  "organization.update": {
    input: organization_update_Input.Input;
    output: organization_update_Output.Output;
    supportsIdempotency: true;
  };
  "organization.initializeOnboarding": {
    input: organization_initializeOnboarding_Input.Input;
    output: organization_initializeOnboarding_Output.Output;
    supportsIdempotency: true;
  };
  "organization.updateOnboarding": {
    input: organization_updateOnboarding_Input.Input;
    output: organization_updateOnboarding_Output.Output;
    supportsIdempotency: true;
  };
  "organization.listInvitations": {
    input: organization_listInvitations_Input.Input;
    output: organization_listInvitations_Output.Output;
    supportsIdempotency: false;
  };
  "organization.invite": {
    input: organization_invite_Input.Input;
    output: organization_invite_Output.Output;
    supportsIdempotency: true;
  };
  "organization.cancelInvitation": {
    input: organization_cancelInvitation_Input.Input;
    output: organization_cancelInvitation_Output.Output;
    supportsIdempotency: true;
  };
}

export type OperationId = keyof OperationTypes;

export type OperationInput<K extends OperationId> = OperationTypes[K]["input"];

export type OperationOutput<K extends OperationId> =
  OperationTypes[K]["output"];
