import { Effect, Result } from "effect";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ApplicationContext } from "../packages/api/src/application/procedure";
import { CredentialRepository } from "../packages/api/src/application/repositories/credentials";
import { MembershipRepository } from "../packages/api/src/application/repositories/membership";
import { changelogRepositoryLive } from "../packages/api/src/infrastructure/changelog";
import { connectionRepositoryLive } from "../packages/api/src/infrastructure/connections";
import { feedbackRepositoryLive } from "../packages/api/src/infrastructure/feedback";
import { publicIndexRepositoryLive } from "../packages/api/src/infrastructure/public-index";

const repository = vi.hoisted(() => ({
  connectionQueries: { list: vi.fn(), revoke: vi.fn(), approval: vi.fn() },
  publicIndexQueries: {
    organizations: vi.fn(),
    counts: vi.fn(),
    items: vi.fn(),
  },
  oauthConnectionQueries: { list: vi.fn(), revoke: vi.fn() },
  referenceQueries: { list: vi.fn(), add: vi.fn(), delete: vi.fn() },
  activityQueries: { list: vi.fn() },
  apiKeyQueries: {
    listByOrganization: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    toggleActive: vi.fn(),
    delete: vi.fn(),
    countActiveKeys: vi.fn(),
  },
  apiKeyPermissions: { canViewApiKeys: vi.fn(), canManageApiKeys: vi.fn() },
  userQueries: { findById: vi.fn(), updateProfile: vi.fn() },
  memberQueries: {
    listByOrganization: vi.fn(),
    findByUserAndOrg: vi.fn(),
    changeMembership: vi.fn(),
    isMember: vi.fn(),
  },
  organizationQueries: {
    patchOnboarding: vi.fn(),
    findById: vi.fn(),
    listUserOrganizations: vi.fn(),
    delete: vi.fn(),
    isSlugAvailable: vi.fn(),
    createWithOwner: vi.fn(),
    update: vi.fn(),
  },
  invitationQueries: {
    listByOrganization: vi.fn(),
    findById: vi.fn(),
    cancel: vi.fn(),
    findPending: vi.fn(),
    create: vi.fn(),
  },
  getFeedbackPost: vi.fn(),
  getComment: vi.fn(),
  canDeleteComment: vi.fn(),
  deleteComment: vi.fn(),
  getFeedbackPosts: vi.fn(),
  searchFeedback: vi.fn(),
  updateFeedbackPost: vi.fn(),
  createChangelogEntryWithFeedback: vi.fn(),
  getChangelogEntry: vi.fn(),
  getChangelogEntries: vi.fn(),
  getLinkedFeedback: vi.fn(),
  publishChangelogEntry: vi.fn(),
  saveChangelogEntry: vi.fn(),
  canManageChangelogSync: (role: string) =>
    role === "admin" || role === "owner",
  linkFeedbackToChangelog: vi.fn(),
  canCommentOnPost: vi.fn(),
  canViewPost: vi.fn(),
  getPostComments: vi.fn(),
  createComment: vi.fn(),
}));
vi.mock("@userbubble/db/queries", async () => ({
  ...repository,
  ChangelogRevisionConflict: (
    await import("../packages/db/src/changelog/changelog.queries")
  ).ChangelogRevisionConflict,
  CredentialLimitError: (await import("../packages/db/src/org/api-key.queries"))
    .CredentialLimitError,
}));
// Unit service checks use an in-memory execution seam. PostgreSQL receipt,
// transaction and audit behavior is covered by the live execution tests.
vi.mock("../packages/api/src/infrastructure/delegation", async () => {
  const { Effect: TestEffect, Layer } = await import("effect");
  const { DelegationRepository } = await import(
    "../packages/api/src/application/repositories/delegation"
  );
  return {
    delegationRepositoryLive: Layer.succeed(DelegationRepository, {
      uuid: TestEffect.succeed("unit-request"),
      user: () => TestEffect.succeed(undefined),
      audit: () => TestEffect.void,
      transaction: (work) => work,
      withReceipt: (_options, work) => work,
    }),
  };
});
vi.mock("@userbubble/auth", () => ({
  generateApiKey: () => "ub_test-raw-key",
  hashApiKey: async () => "stored-secret-hash",
  getKeyPreview: () => "-key",
}));
vi.mock("@userbubble/db/schema", async () => {
  const { z } = await import("zod");
  const { createOrganizationValidator } = await import(
    "../packages/db/src/org/organization.validators"
  );
  return {
    ...(await import("../packages/db/src/org/api-key.validators")),
    createOrganizationValidator,
    ...(await import("../packages/db/src/lib/slug")),
    defaultOnboardingState: {},
    ...(await import("../packages/db/src/org/organization-settings")),
    feedbackStatusValidator: z.enum(["open", "planned", "completed"]),
    feedbackCategoryValidator: z.string(),
    createFeedbackValidator: z.object({
      organizationId: z.string(),
      title: z.string(),
      description: z.string(),
    }),
    updateFeedbackValidator: z.object({ title: z.string().optional() }),
  };
});

import { accountOperations } from "../packages/api/src/application/account";
import { apiKeyOperations } from "../packages/api/src/application/api-key";
import { Authorization } from "../packages/api/src/application/authorization";
import { changelogOperations } from "../packages/api/src/application/changelog";
import {
  approvalOperations,
  connectionOperations,
} from "../packages/api/src/application/connection";
import { ApplicationError } from "../packages/api/src/application/errors";
import { feedbackOperations } from "../packages/api/src/application/feedback";
import { organizationOperations } from "../packages/api/src/application/organization";
import { publicIndexOperations } from "../packages/api/src/application/public-index";
import {
  activityOperations,
  referenceOperations,
} from "../packages/api/src/application/references";
import { OrganizationRepository } from "../packages/api/src/application/repositories/organization";
import { ProfileRepository } from "../packages/api/src/application/repositories/profile";
import { ReferenceRepository } from "../packages/api/src/application/repositories/references";
import { executeOperation } from "../packages/api/src/application/runtime";
import { settingsOperations } from "../packages/api/src/application/settings";

const unusedOrganizationMethod = () =>
  Effect.die("Unexpected organization repository call");
const unusedCredentialRepository = {
  list: unusedOrganizationMethod,
  countActive: unusedOrganizationMethod,
  create: unusedOrganizationMethod,
  find: unusedOrganizationMethod,
  update: unusedOrganizationMethod,
  toggle: unusedOrganizationMethod,
  delete: unusedOrganizationMethod,
};
const unusedOrganizationRepository = {
  bySlug: unusedOrganizationMethod,
  delete: unusedOrganizationMethod,
  list: unusedOrganizationMethod,
  find: unusedOrganizationMethod,
  slugAvailable: unusedOrganizationMethod,
  create: unusedOrganizationMethod,
  update: unusedOrganizationMethod,
  invitations: unusedOrganizationMethod,
  pendingInvitation: unusedOrganizationMethod,
  invitation: unusedOrganizationMethod,
  createInvitation: unusedOrganizationMethod,
  cancelInvitation: unusedOrganizationMethod,
};

const feedbackFixture = {
  id: "post-1",
  organizationId: "org-1",
  title: "Request",
  description: "Details",
  status: "open",
  category: "feature_request",
  voteCount: 0,
  isPublic: true,
  authorId: null,
  revision: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function context(
  overrides: Partial<ApplicationContext> = {}
): ApplicationContext {
  return {
    authApi: {} as ApplicationContext["authApi"],
    session: {
      user: {
        id: "user-1",
        name: "Owner",
        email: "owner@example.test",
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        image: null,
      },
      session: {
        id: "session",
        token: "test",
        sessionType: "authenticated",
        authMethod: "credential",
        userId: "user-1",
        expiresAt: new Date(Date.now() + 60_000),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    },
    identifiedOrgId: null,
    isIdentified: false,
    ...overrides,
  };
}
const invitationFixture = {
  id: "invite-1",
  email: "new@example.test",
  inviterId: "user-1",
  organizationId: "org-1",
  role: "member",
  status: "pending",
  expiresAt: new Date("2030-01-01"),
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};

beforeEach(() => {
  vi.clearAllMocks();
  repository.apiKeyPermissions.canViewApiKeys.mockResolvedValue(true);
  repository.apiKeyPermissions.canManageApiKeys.mockResolvedValue(true);
  repository.apiKeyQueries.countActiveKeys.mockResolvedValue(0);
  repository.memberQueries.findByUserAndOrg.mockResolvedValue({
    id: "member-1",
    organizationId: "org-1",
    role: "owner",
  });
});
describe("shared operation authorization", () => {
  it("rejects unauthenticated management writes", async () => {
    await expect(
      executeOperation(
        feedbackOperations.updateStatus,
        context({ session: null }),
        { organizationId: "org-1", postId: "post-1", status: "planned" }
      )
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(repository.updateFeedbackPost).not.toHaveBeenCalled();
  });
  it("does not promote an embedded customer to a member", async () => {
    await expect(
      executeOperation(
        feedbackOperations.updateStatus,
        context({ isIdentified: true, identifiedOrgId: "org-1" }),
        { organizationId: "org-1", postId: "post-1", status: "planned" }
      )
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
  it("rejects an invalid status before running a write", async () => {
    await expect(
      executeOperation(feedbackOperations.updateStatus, context(), {
        organizationId: "org-1",
        postId: "post-1",
        status: "invented",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(repository.updateFeedbackPost).not.toHaveBeenCalled();
  });
  it("prevents cross-organization roadmap writes", async () => {
    repository.getFeedbackPost.mockResolvedValue({
      post: { organizationId: "org-2" },
    });
    await expect(
      executeOperation(feedbackOperations.updateStatus, context(), {
        organizationId: "org-1",
        postId: "post-2",
        status: "planned",
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(repository.updateFeedbackPost).not.toHaveBeenCalled();
  });
  it("updates a roadmap item in the authorized organization", async () => {
    repository.getFeedbackPost.mockResolvedValue({
      post: { organizationId: "org-1" },
    });
    repository.updateFeedbackPost.mockResolvedValue({
      ...feedbackFixture,
      id: "post-1",
      status: "planned",
    });
    await expect(
      executeOperation(feedbackOperations.updateStatus, context(), {
        organizationId: "org-1",
        postId: "post-1",
        status: "planned",
      })
    ).resolves.toEqual({ ...feedbackFixture, status: "planned" });
  });
  it("does not disclose draft changelog entries to public users", async () => {
    repository.getChangelogEntry.mockResolvedValue({
      organizationId: "org-1",
      isPublished: false,
    });
    await expect(
      executeOperation(
        changelogOperations.getById,
        context({ session: null }),
        { id: "draft" }
      )
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
  it("does not link another organization's feedback", async () => {
    repository.getChangelogEntry.mockResolvedValue({ organizationId: "org-1" });
    repository.getFeedbackPost.mockResolvedValue({
      post: { organizationId: "org-2" },
    });
    await expect(
      executeOperation(changelogOperations.linkFeedback, context(), {
        organizationId: "org-1",
        entryId: "entry",
        feedbackPostIds: ["foreign"],
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(repository.linkFeedbackToChangelog).not.toHaveBeenCalled();
  });
  it("preserves typed membership failures from the transaction", async () => {
    repository.memberQueries.changeMembership.mockResolvedValue({
      error: "CONFLICT",
    });
    await expect(
      executeOperation(settingsOperations.updateMemberRole, context(), {
        organizationId: "org-1",
        memberId: "last-owner",
        role: "member",
      })
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });
  it("rejects a parent comment belonging to a different thread", async () => {
    repository.getFeedbackPost.mockResolvedValue({
      post: { organizationId: "org-1" },
    });
    repository.canViewPost.mockResolvedValue(true);
    repository.canCommentOnPost.mockResolvedValue(true);
    repository.getPostComments.mockResolvedValue([
      { comment: { id: "same-thread" } },
    ]);
    await expect(
      executeOperation(feedbackOperations.createComment, context(), {
        postId: "post-1",
        content: "Reply",
        parentId: "other-thread",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(repository.createComment).not.toHaveBeenCalled();
  });
});

const organizationFixture = {
  settingsRevision: 1,
  id: "org-1",
  name: "Example",
  slug: "example",
  logo: null,
  website: null,
  metadata: null,
  onboarding: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("organization capability parity", () => {
  it("validates reserved addresses before querying or creating", async () => {
    for (const operation of [
      organizationOperations.create,
      organizationOperations.checkSlug,
    ]) {
      await expect(
        executeOperation(operation, context(), {
          name: "Example",
          slug: "admin",
        })
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    }
    expect(
      repository.organizationQueries.isSlugAvailable
    ).not.toHaveBeenCalled();
    expect(
      repository.organizationQueries.createWithOwner
    ).not.toHaveBeenCalled();
  });
  it("creates an organization for the authenticated owner without disclosing the installation secret", async () => {
    repository.organizationQueries.isSlugAvailable.mockResolvedValue(true);
    repository.organizationQueries.createWithOwner.mockResolvedValue({
      ...organizationFixture,
      id: "org-new",
      name: "Example",
      slug: "example",
      secretKey: "installation-secret",
    });
    const result = await executeOperation(
      organizationOperations.create,
      context(),
      { name: "Example", slug: "example" }
    );
    expect(result).toEqual({ ...organizationFixture, id: "org-new" });
    expect(repository.organizationQueries.createWithOwner).toHaveBeenCalledWith(
      { name: "Example", slug: "example" },
      "user-1"
    );
  });
  it("updates branding and allows clearing a logo", async () => {
    repository.organizationQueries.update.mockResolvedValue({
      ...organizationFixture,
      name: "New name",
      logo: null,
      secretKey: "installation-secret",
    });
    await expect(
      executeOperation(organizationOperations.update, context(), {
        organizationId: "org-1",
        name: "New name",
        logo: null,
      })
    ).resolves.toEqual({
      ...organizationFixture,
      name: "New name",
      logo: null,
    });
    expect(repository.organizationQueries.update).toHaveBeenCalledWith(
      "org-1",
      { name: "New name", logo: null }
    );
  });
  it("rejects invalid branding URLs before writing", async () => {
    await expect(
      executeOperation(organizationOperations.update, context(), {
        organizationId: "org-1",
        logo: "not a URL",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(repository.organizationQueries.update).not.toHaveBeenCalled();
  });
  it("denies branding and invitations to members and foreign tenants", async () => {
    for (const membership of [{ id: "member-1", role: "member" }, null]) {
      repository.memberQueries.findByUserAndOrg.mockResolvedValue(membership);
      await expect(
        executeOperation(organizationOperations.update, context(), {
          organizationId: "org-2",
          name: "Changed",
        })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      await expect(
        executeOperation(organizationOperations.invite, context(), {
          organizationId: "org-2",
          email: "invited@example.test",
        })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
    expect(repository.organizationQueries.update).not.toHaveBeenCalled();
    expect(repository.invitationQueries.create).not.toHaveBeenCalled();
  });
  it("creates invitations through the same admin operation", async () => {
    repository.invitationQueries.findPending.mockResolvedValue(null);
    repository.invitationQueries.create.mockResolvedValue({
      ...invitationFixture,
      id: "invitation-1",
    });
    await expect(
      executeOperation(organizationOperations.invite, context(), {
        organizationId: "org-1",
        email: "invited@example.test",
        role: "member",
      })
    ).resolves.toMatchObject({ id: "invitation-1" });
    expect(repository.invitationQueries.create).toHaveBeenCalledWith(
      expect.objectContaining({
        organizationId: "org-1",
        inviterId: "user-1",
        email: "invited@example.test",
        role: "member",
        status: "pending",
      })
    );
  });
  it("rejects invalid invitations before writing", async () => {
    await expect(
      executeOperation(organizationOperations.invite, context(), {
        organizationId: "org-1",
        email: "not-an-email",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(repository.invitationQueries.create).not.toHaveBeenCalled();
  });
});

const releaseFixture = {
  revision: 1,
  id: "release-1",
  organizationId: "org-1",
  title: "Release",
  description: "Shipped",
  version: null,
  isPublished: true,
  publishedAt: null,
  scheduledFor: null,
  authorId: "author",
  coverImageUrl: null,
  tags: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};
const linkedFeedbackFixture = {
  title: "Request",
  description: "Details",
  status: "completed",
  category: "feature_request",
  voteCount: 1,
};

const UNSAFE_HTML = /script|onerror|javascript:/;

describe("release reader boundaries", () => {
  const release = {
    ...releaseFixture,
    id: "release-1",
    organizationId: "org-1",
    isPublished: true,
    description:
      '<p>Shipped</p><script>alert(1)</script><img src="x" onerror="alert(1)"><a href="javascript:alert(1)">link</a>',
    author: {
      id: "author",
      name: "Author",
      image: null,
      email: "private@example.test",
    },
    linkedFeedback: [
      {
        ...linkedFeedbackFixture,
        authorEmail: "private@example.test",
        id: "public",
        organizationId: "org-1",
        isPublic: true,
      },
      {
        ...linkedFeedbackFixture,
        id: "private",
        organizationId: "org-1",
        isPublic: false,
      },
      {
        ...linkedFeedbackFixture,
        id: "foreign",
        organizationId: "org-2",
        isPublic: true,
      },
    ],
  };
  it("returns safe public content without private links or author email", async () => {
    repository.getChangelogEntry.mockResolvedValue(release);
    const result = await executeOperation(
      changelogOperations.getById,
      context({ session: null }),
      { id: release.id, organizationId: "org-1" }
    );
    expect(result.linkedFeedback.map((post) => post.id)).toEqual(["public"]);
    expect(result.author).not.toHaveProperty("email");
    expect(result.linkedFeedback[0]).not.toHaveProperty("authorEmail");
    expect(result.description).toContain("<p>Shipped</p>");
    expect(result.description).not.toMatch(UNSAFE_HTML);
  });
  it("hides foreign releases and drafts from installation identities", async () => {
    repository.getChangelogEntry.mockResolvedValue(release);
    await expect(
      executeOperation(
        changelogOperations.getById,
        context({ session: null }),
        { id: release.id, organizationId: "org-2" }
      )
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    repository.getChangelogEntry.mockResolvedValue({
      ...release,
      isPublished: false,
    });
    await expect(
      executeOperation(
        changelogOperations.getById,
        context({ isIdentified: true, identifiedOrgId: "org-1" }),
        { id: release.id }
      )
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});

describe("release editing parity", () => {
  it("saves content, cleared metadata, selected feedback and publication together", async () => {
    repository.memberQueries.findByUserAndOrg.mockResolvedValue({
      id: "m",
      role: "owner",
    });
    repository.getChangelogEntry.mockResolvedValue({
      id: "release",
      organizationId: "org-1",
    });
    repository.getFeedbackPost.mockResolvedValue({
      post: { organizationId: "org-1" },
    });
    repository.saveChangelogEntry.mockResolvedValue({
      ...releaseFixture,
      id: "release",
      isPublished: true,
    });
    const input = {
      organizationId: "org-1",
      id: "release",
      title: "Updated release",
      description: "Latest content",
      version: null,
      coverImageUrl: null,
      tags: [],
      feedbackPostIds: ["post"],
      publish: true,
    };
    await expect(
      executeOperation(changelogOperations.update, context(), input)
    ).resolves.toMatchObject({ isPublished: true });
    expect(repository.saveChangelogEntry).toHaveBeenCalledWith(
      "release",
      "org-1",
      {
        title: input.title,
        description: input.description,
        version: null,
        coverImageUrl: null,
        tags: [],
        feedbackPostIds: ["post"],
        publish: true,
      }
    );
  });
  it("denies foreign feedback and rejects empty titles before saving", async () => {
    repository.memberQueries.findByUserAndOrg.mockResolvedValue({
      id: "m",
      role: "owner",
    });
    repository.getChangelogEntry.mockResolvedValue({
      id: "release",
      organizationId: "org-1",
    });
    repository.getFeedbackPost.mockResolvedValue({
      post: { organizationId: "org-2" },
    });
    await expect(
      executeOperation(changelogOperations.update, context(), {
        organizationId: "org-1",
        id: "release",
        feedbackPostIds: ["foreign"],
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      executeOperation(changelogOperations.update, context(), {
        organizationId: "org-1",
        id: "release",
        title: "   ",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(repository.saveChangelogEntry).not.toHaveBeenCalled();
  });
});

describe("account profile parity", () => {
  it("updates only the authenticated actor's allowed profile fields", async () => {
    repository.userQueries.updateProfile.mockResolvedValue({
      id: "user-1",
      name: "New name",
      image: null,
      email: "private@example.test",
    });
    await expect(
      executeOperation(accountOperations.updateProfile, context(), {
        userId: "victim",
        name: "  New name  ",
        image: null,
        email: "changed@example.test",
        emailVerified: true,
      })
    ).resolves.toEqual({ id: "user-1", name: "New name", image: null });
    expect(repository.userQueries.updateProfile).toHaveBeenCalledWith(
      "user-1",
      { name: "New name", image: null }
    );
  });
  it("rejects blank names, unsafe images and empty updates", async () => {
    for (const input of [
      {},
      { name: "  " },
      { image: "javascript:alert(1)" },
      { image: "not a URL" },
    ]) {
      await expect(
        executeOperation(accountOperations.updateProfile, context(), input)
      ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    }
    expect(repository.userQueries.updateProfile).not.toHaveBeenCalled();
  });
  it("denies anonymous and installation identities", async () => {
    for (const operation of [
      accountOperations.getProfile,
      accountOperations.updateProfile,
    ]) {
      await expect(
        executeOperation(operation, context({ session: null }), {
          name: "Changed",
        })
      ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
      await expect(
        executeOperation(operation, context({ isIdentified: true }), {
          name: "Changed",
        })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
    expect(repository.userQueries.updateProfile).not.toHaveBeenCalled();
  });
  it("reads fresh profile data without returning authentication fields", async () => {
    repository.userQueries.findById.mockResolvedValue({
      id: "user-1",
      name: "Fresh name",
      image: null,
      emailVerified: true,
      email: "private@example.test",
    });
    await expect(
      executeOperation(accountOperations.getProfile, context(), {})
    ).resolves.toEqual({ id: "user-1", name: "Fresh name", image: null });
  });
});

describe("invitation authorization", () => {
  it("lists invitations only for the authorized organization", async () => {
    repository.invitationQueries.listByOrganization.mockResolvedValue([
      {
        ...invitationFixture,
        inviter: { id: "user-1", name: "Owner", email: "owner@example.test" },
      },
    ]);
    await expect(
      executeOperation(organizationOperations.listInvitations, context(), {
        organizationId: "org-1",
      })
    ).resolves.toMatchObject([{ id: "invite-1", status: "pending" }]);
    expect(
      repository.invitationQueries.listByOrganization
    ).toHaveBeenCalledWith("org-1");
  });

  it.each(["listInvitations", "cancelInvitation", "invite"] as const)(
    "denies ordinary members %s",
    async (operation) => {
      repository.memberQueries.findByUserAndOrg.mockResolvedValue({
        id: "member-1",
        role: "member",
      });
      await expect(
        executeOperation(organizationOperations[operation], context(), {
          organizationId: "org-1",
          invitationId: "invite-1",
          email: "new@example.test",
          role: "member",
        })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
      expect(
        repository.invitationQueries.listByOrganization
      ).not.toHaveBeenCalled();
      expect(repository.invitationQueries.cancel).not.toHaveBeenCalled();
      expect(repository.invitationQueries.create).not.toHaveBeenCalled();
    }
  );

  it("does not cancel another organization's invitation", async () => {
    repository.invitationQueries.findById.mockResolvedValue({
      id: "foreign",
      organizationId: "org-2",
    });
    await expect(
      executeOperation(organizationOperations.cancelInvitation, context(), {
        organizationId: "org-1",
        invitationId: "foreign",
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(repository.invitationQueries.cancel).not.toHaveBeenCalled();
  });

  it("cancels an invitation in the authorized organization", async () => {
    repository.invitationQueries.findById.mockResolvedValue({
      id: "invite-1",
      organizationId: "org-1",
    });
    repository.invitationQueries.cancel.mockResolvedValue({
      ...invitationFixture,
      status: "cancelled",
    });
    await expect(
      executeOperation(organizationOperations.cancelInvitation, context(), {
        organizationId: "org-1",
        invitationId: "invite-1",
      })
    ).resolves.toMatchObject({ status: "cancelled" });
    expect(repository.invitationQueries.cancel).toHaveBeenCalledWith(
      "invite-1",
      "org-1"
    );
  });
  it("reports a conflict when an invitation was accepted before cancellation", async () => {
    repository.invitationQueries.findById.mockResolvedValue({
      id: "invite-1",
      organizationId: "org-1",
    });
    repository.invitationQueries.cancel.mockResolvedValue(undefined);
    await expect(
      executeOperation(organizationOperations.cancelInvitation, context(), {
        organizationId: "org-1",
        invitationId: "invite-1",
      })
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });
});

it("rejects malformed profile results without exposing repository details", async () => {
  repository.userQueries.findById.mockResolvedValue({
    id: 42,
    name: "Owner",
    image: null,
    providerToken: "must-not-appear-in-error",
  });
  await expect(
    executeOperation(accountOperations.getProfile, context(), {})
  ).rejects.toMatchObject({
    code: "INTERNAL_SERVER_ERROR",
    message: "Operation returned an invalid result",
  });
});

it("projects profile results through the contract instead of leaking extra repository fields", async () => {
  repository.userQueries.findById.mockResolvedValue({
    id: "user-1",
    name: "Owner",
    image: null,
    email: "private@example.test",
    providerToken: "secret",
    emailVerified: true,
  });
  await expect(
    executeOperation(accountOperations.getProfile, context(), {})
  ).resolves.toEqual({ id: "user-1", name: "Owner", image: null });
});

it("projects member records and preserves dates without leaking user internals", async () => {
  repository.memberQueries.listByOrganization.mockResolvedValue([
    {
      id: "member-1",
      userId: "user-1",
      organizationId: "org-1",
      role: "owner",
      createdAt: new Date("2026-01-01"),
      updatedAt: new Date("2026-01-02"),
      user: {
        id: "user-1",
        name: "Owner",
        email: "owner@example.test",
        image: null,
        emailVerified: true,
        providerToken: "secret",
      },
    },
  ]);
  const result = await executeOperation(
    settingsOperations.listMembers,
    context(),
    { organizationId: "org-1" }
  );
  expect(result[0]?.createdAt).toBeInstanceOf(Date);
  expect(result[0]?.user).toEqual({
    id: "user-1",
    name: "Owner",
    email: "owner@example.test",
    image: null,
  });
  expect(JSON.parse(JSON.stringify(result))[0].createdAt).toBe(
    "2026-01-01T00:00:00.000Z"
  );
});

it("rejects invalid invitation dates before transport serialization", async () => {
  repository.invitationQueries.findPending.mockResolvedValue({
    ...invitationFixture,
    expiresAt: new Date("invalid"),
  });
  await expect(
    executeOperation(organizationOperations.invite, context(), {
      organizationId: "org-1",
      email: "new@example.test",
    })
  ).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
});

describe("implementation references", () => {
  it("rejects attaching or reading links on another organization's post", async () => {
    repository.getFeedbackPost.mockResolvedValue({
      post: { organizationId: "org-2" },
    });
    for (const operation of [
      referenceOperations.add,
      referenceOperations.list,
    ]) {
      await expect(
        executeOperation(operation, context(), {
          organizationId: "org-1",
          postId: "foreign",
          title: "Fix",
          url: "https://example.test/pr/1",
        })
      ).rejects.toMatchObject({ code: "NOT_FOUND" });
    }
    expect(repository.referenceQueries.add).not.toHaveBeenCalled();
    expect(repository.referenceQueries.list).not.toHaveBeenCalled();
  });
  it("rejects executable URLs before touching storage", async () => {
    await expect(
      executeOperation(referenceOperations.add, context(), {
        organizationId: "org-1",
        postId: "post-1",
        title: "Fix",
        url: "javascript:alert(1)",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(repository.referenceQueries.add).not.toHaveBeenCalled();
  });
  it("preserves nullable historical authorship while projecting link records", async () => {
    repository.getFeedbackPost.mockResolvedValue({
      post: { organizationId: "org-1" },
    });
    const row = {
      id: "ref-1",
      organizationId: "org-1",
      postId: "post-1",
      title: "Fix",
      url: "https://example.test/pr/1",
      authorId: null,
      createdAt: new Date(),
    };
    repository.referenceQueries.list.mockResolvedValue([
      { ...row, providerToken: "secret" },
    ]);
    await expect(
      executeOperation(referenceOperations.list, context(), {
        organizationId: "org-1",
        postId: "post-1",
      })
    ).resolves.toEqual([row]);
  });
  it("projects audit records without exposing unmodeled payloads", async () => {
    const row = {
      id: "activity-1",
      organizationId: "org-1",
      actorId: null,
      agentId: null,
      operation: "reference.add",
      outcome: "success",
      requestId: "request-1",
      resourceId: null,
      createdAt: new Date(),
    };
    repository.activityQueries.list.mockResolvedValue([
      { ...row, credentials: "secret" },
    ]);
    await expect(
      executeOperation(activityOperations.list, context(), {
        organizationId: "org-1",
      })
    ).resolves.toEqual([row]);
    expect(repository.activityQueries.list).toHaveBeenCalledWith("org-1");
  });
});

const publicKey = {
  id: "key-1",
  organizationId: "org-1",
  name: "Widget",
  description: null,
  keyPreview: "-key",
  isActive: true,
  expiresAt: null,
  lastUsedAt: null,
  createdAt: new Date("2026-01-01"),
  updatedAt: new Date("2026-01-01"),
};
const storedKey = {
  ...publicKey,
  keyHash: "stored-secret-hash",
  secretKey: "extra-secret",
};

describe("credential response boundaries", () => {
  it("denies metadata reads outside the user's memberships", async () => {
    repository.memberQueries.findByUserAndOrg.mockResolvedValue(undefined);
    await expect(
      executeOperation(apiKeyOperations.list, context(), {
        organizationId: "foreign-org",
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(repository.apiKeyQueries.listByOrganization).not.toHaveBeenCalled();
  });
  it("lists only public key metadata", async () => {
    repository.apiKeyQueries.listByOrganization.mockResolvedValue([storedKey]);
    await expect(
      executeOperation(apiKeyOperations.list, context(), {
        organizationId: "org-1",
      })
    ).resolves.toEqual([publicKey]);
  });
  it("returns the raw key only in creation, never its stored hash", async () => {
    repository.apiKeyQueries.create.mockResolvedValue(storedKey);
    await expect(
      executeOperation(apiKeyOperations.create, context(), {
        organizationId: "org-1",
        name: "Widget",
      })
    ).resolves.toEqual({ apiKey: publicKey, rawKey: "ub_test-raw-key" });
    expect(repository.apiKeyQueries.create).toHaveBeenCalledWith(
      expect.objectContaining({ keyHash: "stored-secret-hash" })
    );
    expect(
      repository.apiKeyQueries.create.mock.calls[0]?.[0]
    ).not.toHaveProperty("rawKey");
  });
  it("strips hashes from updates and revocations", async () => {
    repository.apiKeyQueries.findById.mockResolvedValue(storedKey);
    repository.apiKeyQueries.update.mockResolvedValue({
      ...storedKey,
      name: "Renamed",
    });
    repository.apiKeyQueries.toggleActive.mockResolvedValue({
      ...storedKey,
      isActive: false,
    });
    await expect(
      executeOperation(apiKeyOperations.update, context(), {
        id: "key-1",
        name: "Renamed",
      })
    ).resolves.toEqual({ ...publicKey, name: "Renamed" });
    await expect(
      executeOperation(apiKeyOperations.toggleActive, context(), {
        id: "key-1",
        isActive: false,
      })
    ).resolves.toEqual({ ...publicKey, isActive: false });
  });
  it("denies credential management before writing when authority is missing", async () => {
    repository.apiKeyQueries.findById.mockResolvedValue(storedKey);
    repository.memberQueries.findByUserAndOrg.mockResolvedValue({
      id: "member-1",
      organizationId: "org-1",
      role: "member",
    });
    for (const operation of [
      apiKeyOperations.create,
      apiKeyOperations.update,
      apiKeyOperations.toggleActive,
      apiKeyOperations.delete,
    ]) {
      await expect(
        executeOperation(operation, context(), {
          organizationId: "org-1",
          id: "key-1",
          name: "Widget",
          isActive: false,
        })
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
    expect(repository.apiKeyQueries.create).not.toHaveBeenCalled();
    expect(repository.apiKeyQueries.update).not.toHaveBeenCalled();
    expect(repository.apiKeyQueries.toggleActive).not.toHaveBeenCalled();
    expect(repository.apiKeyQueries.delete).not.toHaveBeenCalled();
  });
});

describe("organization output boundaries", () => {
  it("projects organization reads and lists and limits delegated lists to their workspace", async () => {
    const stored = {
      ...organizationFixture,
      secretKey: "private",
      internalToken: "private",
    };
    repository.organizationQueries.findById.mockResolvedValue(stored);
    repository.organizationQueries.listUserOrganizations.mockResolvedValue([
      { organization: stored, role: "owner" },
      { organization: { ...stored, id: "org-other" }, role: "owner" },
    ]);
    await expect(
      executeOperation(organizationOperations.get, context(), {
        organizationId: "org-1",
      })
    ).resolves.toEqual(organizationFixture);
    await expect(
      executeOperation(
        organizationOperations.list,
        context({ delegatedOrganizationId: "org-1" }),
        {}
      )
    ).resolves.toEqual([{ ...organizationFixture, role: "owner" }]);
  });
  it("projects saved appearance without returning repository-only fields", async () => {
    repository.organizationQueries.findById.mockResolvedValue(
      organizationFixture
    );
    repository.organizationQueries.update.mockResolvedValue({
      ...organizationFixture,
      secretKey: "private",
      internalToken: "private",
    });
    await expect(
      executeOperation(settingsOperations.updateSettings, context(), {
        organizationId: "org-1",
        settings: { branding: { primaryColor: "#123456" } },
      })
    ).resolves.toEqual(organizationFixture);
    const saved = repository.organizationQueries.update.mock.calls[0]?.[1];
    expect(JSON.parse(saved.metadata).branding.primaryColor).toBe("#123456");
  });
  it("rejects malformed organization results instead of passing them to transports", async () => {
    repository.organizationQueries.findById.mockResolvedValue({
      ...organizationFixture,
      createdAt: "invalid",
    });
    await expect(
      executeOperation(organizationOperations.get, context(), {
        organizationId: "org-1",
      })
    ).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
  });
  it("requires owner authority and the exact organization name before deletion", async () => {
    repository.organizationQueries.delete.mockResolvedValue(undefined);
    repository.organizationQueries.findById.mockResolvedValue(
      organizationFixture
    );
    await expect(
      executeOperation(settingsOperations.deleteOrganization, context(), {
        organizationId: "org-1",
        confirmationName: "Wrong",
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    expect(repository.organizationQueries.delete).not.toHaveBeenCalled();
    repository.memberQueries.findByUserAndOrg.mockResolvedValue({
      id: "member",
      role: "admin",
    });
    await expect(
      executeOperation(settingsOperations.deleteOrganization, context(), {
        organizationId: "org-1",
        confirmationName: "Example",
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(repository.organizationQueries.delete).not.toHaveBeenCalled();
    repository.memberQueries.findByUserAndOrg.mockResolvedValue({
      id: "owner",
      role: "owner",
    });
    await expect(
      executeOperation(settingsOperations.deleteOrganization, context(), {
        organizationId: "org-1",
        confirmationName: "Example",
      })
    ).resolves.toEqual({ success: true });
    expect(repository.organizationQueries.delete).toHaveBeenCalledWith("org-1");
  });
  it("returns only success for completed membership mutations", async () => {
    repository.memberQueries.changeMembership.mockResolvedValue({
      success: true,
      internalToken: "private",
    });
    for (const operation of [
      settingsOperations.updateMemberRole,
      settingsOperations.removeMember,
    ]) {
      await expect(
        executeOperation(operation, context(), {
          organizationId: "org-1",
          memberId: "member",
          role: "member",
        })
      ).resolves.toEqual({ success: true });
    }
  });
});

describe("connection output and delegation boundaries", () => {
  const grant = {
    capability: "feedback.getAll",
    status: "active",
    constraints: JSON.stringify({ organizationId: { eq: "org-1" } }),
    expiresAt: null,
  };
  const connection = {
    id: "agent-1",
    name: "My agent",
    status: "active",
    createdAt: new Date(),
    lastUsedAt: null,
    grants: [grant],
  };
  it("projects nested agent grants and hides grants outside delegated authority", async () => {
    repository.connectionQueries.list.mockResolvedValue([
      {
        ...connection,
        enrollmentTokenHash: "private",
        grants: [
          { ...grant, secret: "private" },
          {
            ...grant,
            constraints: JSON.stringify({
              organizationId: { eq: "org-other" },
            }),
          },
        ],
      },
    ]);
    await expect(
      executeOperation(
        connectionOperations.list,
        context({ delegatedOrganizationId: "org-1" }),
        {}
      )
    ).resolves.toEqual([connection]);
    expect(repository.connectionQueries.list).toHaveBeenCalledWith("user-1");
  });
  it("denies revoking an agent with grants outside the delegated workspace", async () => {
    repository.connectionQueries.list.mockResolvedValue([
      { ...connection, grants: [grant, { ...grant, constraints: null }] },
    ]);
    await expect(
      executeOperation(
        connectionOperations.revoke,
        context({ delegatedOrganizationId: "org-1" }),
        { agentId: connection.id }
      )
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(repository.connectionQueries.revoke).not.toHaveBeenCalled();
  });
  it("projects OAuth connection metadata without client secrets", async () => {
    const consent = {
      id: "consent",
      clientId: "client",
      name: null,
      organizationId: "org-1",
      scopes: ["userbubble:manage"],
      createdAt: new Date(),
    };
    repository.oauthConnectionQueries.list.mockResolvedValue([
      { ...consent, clientSecret: "private" },
      { ...consent, id: "other", organizationId: "org-other" },
    ]);
    await expect(
      executeOperation(
        connectionOperations.listOAuth,
        context({ delegatedOrganizationId: "org-1" }),
        {}
      )
    ).resolves.toEqual([consent]);
    expect(repository.oauthConnectionQueries.list).toHaveBeenCalledWith(
      "user-1"
    );
  });
  it("rejects foreign OAuth revocation before writing", async () => {
    repository.oauthConnectionQueries.list.mockResolvedValue([
      { ...linkedFeedbackFixture, id: "foreign", organizationId: "org-other" },
    ]);
    await expect(
      executeOperation(
        connectionOperations.revokeOAuth,
        context({ delegatedOrganizationId: "org-1" }),
        { consentId: "foreign" }
      )
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(repository.oauthConnectionQueries.revoke).not.toHaveBeenCalled();
  });
  it("binds human revocation to the current user and reports missing connections", async () => {
    repository.connectionQueries.revoke.mockResolvedValue(true);
    repository.oauthConnectionQueries.revoke.mockResolvedValue(false);
    await expect(
      executeOperation(connectionOperations.revoke, context(), {
        agentId: "agent-1",
      })
    ).resolves.toEqual({ success: true });
    expect(repository.connectionQueries.revoke).toHaveBeenCalledWith(
      "user-1",
      "agent-1"
    );
    await expect(
      executeOperation(connectionOperations.revokeOAuth, context(), {
        consentId: "absent",
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(repository.oauthConnectionQueries.revoke).toHaveBeenCalledWith(
      "user-1",
      "absent"
    );
  });
});

describe("release output contracts", () => {
  it("filters private linked feedback and author email from public lists", async () => {
    repository.getChangelogEntries.mockResolvedValue([
      {
        ...releaseFixture,
        author: {
          id: "author",
          name: "Author",
          image: null,
          email: "private@example.test",
        },
        internalToken: "private",
      },
    ]);
    repository.getLinkedFeedback.mockResolvedValue([
      {
        ...linkedFeedbackFixture,
        id: "public",
        organizationId: "org-1",
        isPublic: true,
        authorEmail: "anonymous@example.test",
      },
      {
        ...linkedFeedbackFixture,
        id: "private",
        organizationId: "org-1",
        isPublic: false,
      },
    ]);
    const entries = await executeOperation(
      changelogOperations.getAll,
      context({ session: null }),
      { organizationId: "org-1", published: false }
    );
    expect(entries).toHaveLength(1);
    expect(entries[0]).not.toHaveProperty("internalToken");
    expect(entries[0]?.author).not.toHaveProperty("email");
    expect(entries[0]?.linkedFeedback).toEqual([
      {
        ...linkedFeedbackFixture,
        id: "public",
        organizationId: "org-1",
        isPublic: true,
      },
    ]);
    expect(repository.getChangelogEntries).toHaveBeenCalledWith(
      "org-1",
      expect.objectContaining({ published: true })
    );
  });
  it("handles a release removed during publication as not found", async () => {
    repository.getChangelogEntry.mockResolvedValue(releaseFixture);
    repository.publishChangelogEntry.mockResolvedValue(undefined);
    await expect(
      executeOperation(changelogOperations.publish, context(), {
        organizationId: "org-1",
        id: releaseFixture.id,
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
  it("rejects malformed release output instead of serializing it", async () => {
    repository.getChangelogEntries.mockResolvedValue([
      { ...releaseFixture, tags: [123], author: null },
    ]);
    repository.getLinkedFeedback.mockResolvedValue([]);
    await expect(
      executeOperation(changelogOperations.getAll, context({ session: null }), {
        organizationId: "org-1",
      })
    ).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
  });
});

describe("feedback output contracts", () => {
  it("projects search results without exposing anonymous author email or internal cursor fields", async () => {
    const nextCursor = {
      updatedAt: "2026-10-02T01:02:03.123456Z",
      id: "post-1",
    };
    repository.searchFeedback.mockResolvedValue({
      items: [
        {
          post: { ...feedbackFixture, authorEmail: "private@example.test" },
          author: null,
          cursorTimestamp: "internal",
        },
      ],
      nextCursor,
    });
    await expect(
      executeOperation(feedbackOperations.search, context(), {
        organizationId: "org-1",
      })
    ).resolves.toEqual({
      items: [{ post: feedbackFixture, author: null }],
      nextCursor,
    });
  });
  it("keeps vote state while stripping repository fields from feedback lists", async () => {
    repository.getFeedbackPosts.mockResolvedValue([
      {
        post: { ...feedbackFixture, authorEmail: "private@example.test" },
        author: {
          name: "Anonymous",
          image: null,
          email: "private@example.test",
        },
        hasUserVoted: true,
      },
    ]);
    const rows = await executeOperation(
      feedbackOperations.getAll,
      context({ session: null }),
      { organizationId: "org-1" }
    );
    expect(rows).toEqual([
      {
        post: feedbackFixture,
        author: { name: "Anonymous", image: null },
        hasUserVoted: true,
      },
    ]);
  });
  it("preserves historical comment attribution without exposing private author fields", async () => {
    const comment = {
      id: "comment",
      postId: "post-1",
      authorId: null,
      authorName: "Historical author",
      content: "Previously posted",
      isAiGenerated: true,
      parentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    repository.getFeedbackPost.mockResolvedValue({ post: feedbackFixture });
    repository.canViewPost.mockResolvedValue(true);
    repository.getPostComments.mockResolvedValue([
      {
        comment: { ...comment, providerCredential: "private" },
        author: null,
        isTeamMember: false,
      },
    ]);
    await expect(
      executeOperation(
        feedbackOperations.getComments,
        context({ session: null }),
        { postId: "post-1" }
      )
    ).resolves.toEqual([{ comment, author: null, isTeamMember: false }]);
  });
  it("rejects malformed feedback before transport serialization", async () => {
    repository.getFeedbackPost.mockResolvedValue({
      post: { ...feedbackFixture, revision: "invalid" },
      author: null,
    });
    repository.canViewPost.mockResolvedValue(true);
    await expect(
      executeOperation(feedbackOperations.getById, context(), { id: "post-1" })
    ).rejects.toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
  });
});

it("accepts JSON release dates and rejects invalid ranges before querying", async () => {
  repository.getChangelogEntries.mockResolvedValue([]);
  const input = {
    organizationId: "org-1",
    dateFrom: "2026-01-01T00:00:00Z",
    dateTo: "2026-01-31T23:59:59Z",
    tags: ["feature"],
    limit: 2,
    offset: 1,
  };
  await executeOperation(changelogOperations.getAll, context(), input);
  expect(repository.getChangelogEntries).toHaveBeenCalledWith(
    "org-1",
    expect.objectContaining({
      dateFrom: new Date(input.dateFrom),
      dateTo: new Date(input.dateTo),
      tags: ["feature"],
      limit: 2,
      offset: 1,
    })
  );
  repository.getChangelogEntries.mockClear();
  for (const invalid of [
    { dateFrom: "not-a-date" },
    { dateFrom: input.dateTo, dateTo: input.dateFrom },
    { dateFrom: 123 },
    { dateFrom: "2026-02-30T00:00:00Z" },
    { dateFrom: "2026-01-01" },
    { dateFrom: "2026-01-01T00:00:00" },
    { limit: 1.5 },
    { offset: -1 },
  ]) {
    await expect(
      executeOperation(changelogOperations.getAll, context(), {
        ...input,
        ...invalid,
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  }
  expect(repository.getChangelogEntries).not.toHaveBeenCalled();
});

it("rejects invalid Effect connection and reference inputs before repository access", async () => {
  for (const [operation, input] of [
    [connectionOperations.revoke, { agentId: "" }],
    [connectionOperations.revokeOAuth, { consentId: 42 }],
    [referenceOperations.list, { organizationId: "", postId: "post" }],
    [
      referenceOperations.add,
      {
        organizationId: "org-1",
        postId: "post",
        url: "https://",
        title: "Link",
      },
    ],
    [
      referenceOperations.add,
      {
        organizationId: "org-1",
        postId: "post",
        url: "https://example.test",
        title: "  ",
      },
    ],
  ] as const) {
    await expect(
      executeOperation(operation, context(), input)
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  }
  expect(repository.connectionQueries.revoke).not.toHaveBeenCalled();
  expect(repository.oauthConnectionQueries.revoke).not.toHaveBeenCalled();
  expect(repository.referenceQueries.add).not.toHaveBeenCalled();
  expect(repository.referenceQueries.list).not.toHaveBeenCalled();
});

describe("installation feedback scope", () => {
  it("denies foreign list, thread and comments even when the post is readable", async () => {
    const installation = context({
      isIdentified: true,
      identifiedOrgId: "org-1",
    });
    repository.getFeedbackPost.mockResolvedValue({
      post: { ...feedbackFixture, organizationId: "org-other" },
    });
    repository.canViewPost.mockResolvedValue(true);
    for (const [operation, input] of [
      [feedbackOperations.getAll, { organizationId: "org-other" }],
      [feedbackOperations.getById, { id: "post-1" }],
      [feedbackOperations.getComments, { postId: "post-1" }],
    ] as const) {
      await expect(
        executeOperation(operation, installation, input)
      ).rejects.toMatchObject({ code: "FORBIDDEN" });
    }
    expect(repository.getFeedbackPosts).not.toHaveBeenCalled();
    expect(repository.getPostComments).not.toHaveBeenCalled();
    expect(repository.canViewPost).not.toHaveBeenCalled();
  });
  it("denies foreign comment deletion before author or member permissions are consulted", async () => {
    repository.getComment.mockResolvedValue({ postId: "post-1" });
    repository.getFeedbackPost.mockResolvedValue({
      post: { ...feedbackFixture, organizationId: "org-other" },
    });
    repository.canDeleteComment.mockResolvedValue(true);
    await expect(
      executeOperation(
        feedbackOperations.deleteComment,
        context({ isIdentified: true, identifiedOrgId: "org-1" }),
        { id: "comment" }
      )
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
    expect(repository.canDeleteComment).not.toHaveBeenCalled();
    expect(repository.deleteComment).not.toHaveBeenCalled();
  });
  it("permits authorized deletion within the installation workspace", async () => {
    repository.getComment.mockResolvedValue({
      postId: "post-1",
      authorId: "user-1",
    });
    repository.getFeedbackPost.mockResolvedValue({ post: feedbackFixture });
    repository.canDeleteComment.mockResolvedValue(true);
    await expect(
      executeOperation(
        feedbackOperations.deleteComment,
        context({ isIdentified: true, identifiedOrgId: "org-1" }),
        { id: "comment" }
      )
    ).resolves.toEqual({ success: true });
    expect(repository.deleteComment).toHaveBeenCalledWith("comment");
  });
});

it("scopes installation release reads without restricting anonymous public readers", async () => {
  repository.getChangelogEntry.mockResolvedValue({
    ...releaseFixture,
    author: null,
    linkedFeedback: [],
  });
  const installation = context({
    isIdentified: true,
    identifiedOrgId: "org-other",
  });
  await expect(
    executeOperation(changelogOperations.getAll, installation, {
      organizationId: "org-1",
    })
  ).rejects.toMatchObject({ code: "FORBIDDEN" });
  await expect(
    executeOperation(changelogOperations.getById, installation, {
      id: releaseFixture.id,
    })
  ).rejects.toMatchObject({ code: "FORBIDDEN" });
  expect(repository.getChangelogEntries).not.toHaveBeenCalled();
  await expect(
    executeOperation(changelogOperations.getById, context({ session: null }), {
      id: releaseFixture.id,
    })
  ).resolves.toMatchObject({ id: releaseFixture.id });
});

it("rejects malformed membership and onboarding Effect inputs before writes", async () => {
  for (const [operation, input] of [
    [
      settingsOperations.updateMemberRole,
      { organizationId: "org-1", memberId: "member", role: "superuser" },
    ],
    [
      settingsOperations.removeMember,
      { organizationId: "org-1", memberId: "" },
    ],
    [
      settingsOperations.deleteOrganization,
      { organizationId: "org-1", confirmationName: 123 },
    ],
    [
      organizationOperations.cancelInvitation,
      { organizationId: "org-1", invitationId: "" },
    ],
    [
      organizationOperations.updateOnboarding,
      { organizationId: "org-1", steps: { installWidget: "yes" } },
    ],
  ] as const) {
    await expect(
      executeOperation(operation, context(), input)
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  }
  expect(repository.memberQueries.changeMembership).not.toHaveBeenCalled();
  expect(repository.organizationQueries.delete).not.toHaveBeenCalled();
  expect(repository.organizationQueries.update).not.toHaveBeenCalled();
  expect(repository.invitationQueries.cancel).not.toHaveBeenCalled();
});

it("decodes credential expiration across JSON and dashboard inputs", async () => {
  repository.apiKeyQueries.create.mockResolvedValue(storedKey);
  const expiration = new Date("2030-01-01T00:00:00.000Z");
  for (const expiresAt of [
    expiration,
    expiration.toISOString(),
    expiration.getTime(),
    null,
  ]) {
    await executeOperation(apiKeyOperations.create, context(), {
      organizationId: "org-1",
      name: "  Widget  ",
      expiresAt,
    });
    expect(repository.apiKeyQueries.create).toHaveBeenLastCalledWith(
      expect.objectContaining({
        name: "Widget",
        expiresAt: expiresAt === null ? null : expiration,
      })
    );
  }
});

it("rejects malformed credential contracts before reading or writing keys", async () => {
  for (const [operation, input] of [
    [apiKeyOperations.list, { organizationId: "" }],
    [apiKeyOperations.create, { organizationId: "org-1", name: "   " }],
    [
      apiKeyOperations.create,
      { organizationId: "org-1", name: "Widget", expiresAt: "invalid" },
    ],
    [
      apiKeyOperations.create,
      { organizationId: "org-1", name: "Widget", expiresAt: true },
    ],
    [
      apiKeyOperations.create,
      {
        organizationId: "org-1",
        name: "Widget",
        expiresAt: new Date("invalid"),
      },
    ],
    [apiKeyOperations.update, { id: "key-1", description: "x".repeat(201) }],
    [apiKeyOperations.toggleActive, { id: "key-1", isActive: "false" }],
    [apiKeyOperations.delete, { id: "" }],
  ] as const) {
    await expect(
      executeOperation(operation, context(), input)
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  }
  expect(repository.apiKeyQueries.listByOrganization).not.toHaveBeenCalled();
  expect(repository.apiKeyQueries.findById).not.toHaveBeenCalled();
  expect(repository.apiKeyQueries.create).not.toHaveBeenCalled();
  expect(repository.apiKeyQueries.update).not.toHaveBeenCalled();
  expect(repository.apiKeyQueries.toggleActive).not.toHaveBeenCalled();
  expect(repository.apiKeyQueries.delete).not.toHaveBeenCalled();
});

it("treats explicit undefined credential fields like omitted JSON properties", async () => {
  repository.apiKeyQueries.create.mockResolvedValue(storedKey);
  const input = {
    organizationId: "org-1",
    name: "Widget",
    description: undefined,
    expiresAt: undefined,
  };
  const parsed = apiKeyOperations.create.input.parse(input);
  expect(parsed).toEqual({ organizationId: "org-1", name: "Widget" });
  await expect(
    executeOperation(apiKeyOperations.create, context(), input)
  ).resolves.toEqual({ apiKey: publicKey, rawKey: "ub_test-raw-key" });
});

it("normalizes organization creation and preserves the default invitation role", async () => {
  repository.organizationQueries.isSlugAvailable.mockResolvedValue(true);
  repository.organizationQueries.createWithOwner.mockResolvedValue(
    organizationFixture
  );
  await executeOperation(organizationOperations.create, context(), {
    name: "  Example  ",
    slug: "EXAMPLE",
  });
  expect(repository.organizationQueries.createWithOwner).toHaveBeenCalledWith(
    { name: "Example", slug: "example" },
    "user-1"
  );
  repository.invitationQueries.findPending.mockResolvedValue(null);
  repository.invitationQueries.create.mockResolvedValue(invitationFixture);
  await executeOperation(organizationOperations.invite, context(), {
    organizationId: "org-1",
    email: "invite@example.test",
  });
  expect(repository.invitationQueries.create).toHaveBeenCalledWith(
    expect.objectContaining({ role: "member" })
  );
});

it("rejects malformed organization Effect inputs before availability checks or writes", async () => {
  for (const [operation, input] of [
    [organizationOperations.checkSlug, { slug: "ADMIN" }],
    [organizationOperations.create, { name: "Example", slug: "bad_slug" }],
    [organizationOperations.create, { name: "ab", slug: "example" }],
    [organizationOperations.update, { organizationId: "org-1", name: "  " }],
    [
      organizationOperations.invite,
      { organizationId: "org-1", email: "bad@email" },
    ],
    [
      organizationOperations.invite,
      { organizationId: "org-1", email: "invite@example.test", role: "owner" },
    ],
  ] as const) {
    await expect(
      executeOperation(operation, context(), input)
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  }
  expect(repository.organizationQueries.isSlugAvailable).not.toHaveBeenCalled();
  expect(repository.organizationQueries.createWithOwner).not.toHaveBeenCalled();
  expect(repository.organizationQueries.update).not.toHaveBeenCalled();
  expect(repository.invitationQueries.create).not.toHaveBeenCalled();
});

it("creates release drafts by default through Effect inputs", async () => {
  repository.createChangelogEntryWithFeedback.mockResolvedValue({
    ...releaseFixture,
    isPublished: false,
  });
  await executeOperation(changelogOperations.create, context(), {
    organizationId: "org-1",
    title: "New release",
    description: "Release notes",
    tags: ["feature"],
  });
  expect(repository.createChangelogEntryWithFeedback).toHaveBeenCalledWith(
    expect.objectContaining({
      isPublished: false,
      publishedAt: undefined,
      tags: ["feature"],
    })
  );
});

it("rejects malformed release mutations before resource lookup", async () => {
  for (const [operation, input] of [
    [
      changelogOperations.create,
      { organizationId: "org-1", title: "", description: "Notes" },
    ],
    [
      changelogOperations.update,
      { organizationId: "org-1", id: "release", coverImageUrl: "bad-url" },
    ],
    [changelogOperations.publish, { organizationId: "org-1", id: "" }],
    [changelogOperations.delete, { organizationId: "", id: "release" }],
    [
      changelogOperations.linkFeedback,
      { organizationId: "org-1", entryId: "release", feedbackPostIds: [""] },
    ],
    [
      changelogOperations.unlinkFeedback,
      { organizationId: "org-1", entryId: "release", feedbackPostIds: "post" },
    ],
  ] as const) {
    await expect(
      executeOperation(operation, context(), input)
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  }
  expect(repository.getChangelogEntry).not.toHaveBeenCalled();
  expect(repository.createChangelogEntryWithFeedback).not.toHaveBeenCalled();
});

it("preserves omitted nested settings while applying explicit false and empty arrays", async () => {
  const settings = {
    publicAccess: {
      allowAnonymousSubmissions: true,
      allowAnonymousVoting: false,
      allowAnonymousComments: true,
      requireApproval: true,
    },
    branding: {
      primaryColor: "#123456",
      accentColor: "#abcdef",
      logoUrl: "https://example.test/logo.png",
    },
    feedback: {
      enableRoadmap: true,
      enableDigestEmails: true,
      boards: ["ideas"],
      tags: ["feature"],
    },
    changelog: { enabled: true, tags: ["release"] },
    domain: { customDomain: "feedback.example.test", domainVerified: true },
  };
  repository.organizationQueries.findById.mockResolvedValue({
    ...organizationFixture,
    metadata: JSON.stringify(settings),
  });
  repository.organizationQueries.update.mockResolvedValue(organizationFixture);
  await executeOperation(settingsOperations.updateSettings, context(), {
    organizationId: "org-1",
    settings: {
      publicAccess: { allowAnonymousComments: false },
      branding: { primaryColor: "#654321" },
      feedback: { tags: [] },
      changelog: { enabled: false },
      domain: {},
    },
  });
  expect(repository.organizationQueries.update).toHaveBeenCalledWith(
    "org-1",
    {
      metadata: JSON.stringify({
        ...settings,
        publicAccess: {
          ...settings.publicAccess,
          allowAnonymousComments: false,
        },
        branding: { ...settings.branding, primaryColor: "#654321" },
        feedback: { ...settings.feedback, tags: [] },
        changelog: { ...settings.changelog, enabled: false },
      }),
    },
    1
  );
});

it("rejects invalid settings fields before reading organization metadata", async () => {
  for (const settings of [
    { branding: { primaryColor: "red" } },
    { publicAccess: { allowAnonymousVoting: "false" } },
    { feedback: { tags: [123] } },
    { changelog: { enabled: null } },
    { domain: { domainVerified: 1 } },
  ]) {
    await expect(
      executeOperation(settingsOperations.updateSettings, context(), {
        organizationId: "org-1",
        settings,
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  }
  expect(repository.organizationQueries.findById).not.toHaveBeenCalled();
  expect(repository.organizationQueries.update).not.toHaveBeenCalled();
});

it("retains feedback cursor precision and defaults search page size", async () => {
  repository.searchFeedback.mockResolvedValue({ items: [], nextCursor: null });
  const cursor = { updatedAt: "2026-01-01T00:00:00.123456Z", id: "post-1" };
  await executeOperation(feedbackOperations.search, context(), {
    organizationId: "org-1",
    cursor,
  });
  expect(repository.searchFeedback).toHaveBeenCalledWith(
    "org-1",
    expect.objectContaining({ cursor, limit: 50 })
  );
});

it("rejects malformed feedback operations before repository access", async () => {
  for (const [operation, input] of [
    [
      feedbackOperations.search,
      {
        organizationId: "org-1",
        cursor: { updatedAt: "2026-02-30T00:00:00Z", id: "post-1" },
      },
    ],
    [feedbackOperations.search, { organizationId: "org-1", limit: 101 }],
    [
      feedbackOperations.getAll,
      { organizationId: "org-1", status: ["unknown"] },
    ],
    [feedbackOperations.getById, { id: "" }],
    [
      feedbackOperations.create,
      {
        organizationId: "org-1",
        title: "ab",
        description: "Description",
        category: "bug",
      },
    ],
    [feedbackOperations.update, { id: "post-1", expectedRevision: 0 }],
    [feedbackOperations.delete, { id: 1 }],
    [feedbackOperations.vote, { postId: "post-1", value: 0.5 }],
    [
      feedbackOperations.updateStatus,
      { organizationId: "org-1", postId: "post-1", status: "unknown" },
    ],
    [feedbackOperations.getComments, { postId: "" }],
    [
      feedbackOperations.createComment,
      { postId: "post-1", content: "x".repeat(2001) },
    ],
    [feedbackOperations.deleteComment, { id: "" }],
  ] as const) {
    await expect(
      executeOperation(operation, context(), input)
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  }
  expect(repository.searchFeedback).not.toHaveBeenCalled();
  expect(repository.getFeedbackPost).not.toHaveBeenCalled();
  expect(repository.getFeedbackPosts).not.toHaveBeenCalled();
  expect(repository.getComment).not.toHaveBeenCalled();
});

it("validates internal public indexing inputs through Effect", async () => {
  repository.publicIndexQueries.items.mockResolvedValue([]);
  await executeOperation(
    publicIndexOperations.items,
    context({ session: null }),
    { organizationId: "org-1", kind: "feedback", page: 0 }
  );
  expect(repository.publicIndexQueries.items).toHaveBeenCalledWith(
    "org-1",
    "feedback",
    0
  );
  repository.publicIndexQueries.items.mockClear();
  for (const input of [
    { organizationId: "org-1", kind: "feedback", page: -1 },
    { organizationId: "org-1", kind: "private", page: 0 },
    { organizationId: "org-1", kind: "feedback", page: 1.5 },
  ]) {
    await expect(
      executeOperation(publicIndexOperations.items, context(), input)
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  }
  expect(repository.publicIndexQueries.items).not.toHaveBeenCalled();
});

it("keeps approval lookup tied to a human session and validated request code", async () => {
  repository.connectionQueries.approval.mockResolvedValue({ id: "request-1" });
  const input = { agentId: "agent-1", code: "valid-code" };
  await expect(
    executeOperation(approvalOperations.get, context(), input)
  ).resolves.toEqual({ id: "request-1" });
  expect(repository.connectionQueries.approval).toHaveBeenCalledWith(
    "user-1",
    "agent-1",
    "valid-code"
  );
  repository.connectionQueries.approval.mockClear();
  await expect(
    executeOperation(
      approvalOperations.get,
      context({ agentId: "another-agent" }),
      input
    )
  ).rejects.toMatchObject({ code: "FORBIDDEN" });
  await expect(
    executeOperation(approvalOperations.get, context({ session: null }), input)
  ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
  await expect(
    executeOperation(approvalOperations.get, context(), { ...input, code: "" })
  ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  await expect(
    executeOperation(approvalOperations.respond, context(), {
      ...input,
      action: "invalid",
    })
  ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  expect(repository.connectionQueries.approval).not.toHaveBeenCalled();
});

it.each(["approve", "deny"] as const)(
  "passes a human %s response to the auth adapter",
  async (action) => {
    const approveCapability = vi
      .fn()
      .mockResolvedValue(Response.json({ status: "approved" }));
    repository.connectionQueries.approval.mockResolvedValue({
      id: "request-1",
    });
    const headers = new Headers({ "x-test-request": "approval" });
    await executeOperation(
      approvalOperations.respond,
      context({
        headers,
        authApi: {
          approveCapability,
        } as unknown as ApplicationContext["authApi"],
      }),
      { agentId: "agent-1", code: "valid-code", action }
    );
    expect(approveCapability).toHaveBeenCalledWith({
      headers,
      asResponse: true,
      body: {
        agent_id: "agent-1",
        user_code: "valid-code",
        action,
        ttl: 86_400,
      },
    });
  }
);

it("runs profile logic with an injected Effect repository", async () => {
  const update = vi.fn((userId: string, patch: { readonly name?: string }) =>
    Effect.succeed({ id: userId, name: patch.name ?? "Before", image: null })
  );
  const result = await Effect.runPromise(
    accountOperations.updateProfile
      .execute(context(), { name: "  Injected  " })
      .pipe(
        Effect.provide(feedbackRepositoryLive),
        Effect.provide(changelogRepositoryLive),
        Effect.provide(connectionRepositoryLive),
        Effect.provide(publicIndexRepositoryLive),
        Effect.provideService(ReferenceRepository, {
          postOrganization: () => Effect.die("unused"),
          list: () => Effect.die("unused"),
          add: () => Effect.die("unused"),
          delete: () => Effect.die("unused"),
          activity: () => Effect.die("unused"),
        }),
        Effect.provideService(CredentialRepository, unusedCredentialRepository),
        Effect.provideService(MembershipRepository, {
          list: unusedOrganizationMethod,
          change: unusedOrganizationMethod,
        }),
        Effect.provideService(
          OrganizationRepository,
          unusedOrganizationRepository
        ),
        Effect.provideService(ProfileRepository, {
          find: () => Effect.succeed(undefined),
          update,
        }),
        Effect.provideService(Authorization, {
          membership: () => Effect.die("Profile does not query membership"),
        })
      )
  );
  expect(result).toEqual({ id: "user-1", name: "Injected", image: null });
  expect(update).toHaveBeenCalledWith("user-1", { name: "Injected" });
  expect(repository.userQueries.updateProfile).not.toHaveBeenCalled();
});

it("preserves typed profile repository failures without turning them into output errors", async () => {
  const failure = new ApplicationError({
    code: "CONFLICT",
    message: "Profile changed",
  });
  const result = await Effect.runPromise(
    Effect.result(
      accountOperations.getProfile.execute(context(), {}).pipe(
        Effect.provide(feedbackRepositoryLive),
        Effect.provide(changelogRepositoryLive),
        Effect.provide(connectionRepositoryLive),
        Effect.provide(publicIndexRepositoryLive),
        Effect.provideService(ReferenceRepository, {
          postOrganization: () => Effect.die("unused"),
          list: () => Effect.die("unused"),
          add: () => Effect.die("unused"),
          delete: () => Effect.die("unused"),
          activity: () => Effect.die("unused"),
        }),
        Effect.provideService(CredentialRepository, unusedCredentialRepository),
        Effect.provideService(MembershipRepository, {
          list: unusedOrganizationMethod,
          change: unusedOrganizationMethod,
        }),
        Effect.provideService(
          OrganizationRepository,
          unusedOrganizationRepository
        ),
        Effect.provideService(ProfileRepository, {
          find: () => Effect.fail(failure),
          update: () => Effect.succeed(undefined),
        }),
        Effect.provideService(Authorization, {
          membership: () => Effect.succeed(undefined),
        })
      )
    )
  );
  expect(Result.isFailure(result)).toBe(true);
  if (Result.isFailure(result)) {
    expect(result.failure).toBe(failure);
  }
  expect(repository.userQueries.findById).not.toHaveBeenCalled();
});

it("checks reference ownership before writing through the injected repository", async () => {
  const add = vi.fn(() => Effect.die("Must not write a foreign reference"));
  const result = await Effect.runPromise(
    Effect.result(
      referenceOperations.add
        .execute(context(), {
          organizationId: "org-1",
          postId: "foreign-post",
          title: "Implementation",
          url: "https://example.test/pr/1",
        })
        .pipe(
          Effect.provide(feedbackRepositoryLive),
          Effect.provide(changelogRepositoryLive),
          Effect.provide(connectionRepositoryLive),
          Effect.provide(publicIndexRepositoryLive),
          Effect.provideService(ReferenceRepository, {
            postOrganization: () => Effect.succeed("org-2"),
            list: () => Effect.succeed([]),
            add,
            delete: () => Effect.void,
            activity: () => Effect.succeed([]),
          }),
          Effect.provideService(
            CredentialRepository,
            unusedCredentialRepository
          ),
          Effect.provideService(MembershipRepository, {
            list: unusedOrganizationMethod,
            change: unusedOrganizationMethod,
          }),
          Effect.provideService(
            OrganizationRepository,
            unusedOrganizationRepository
          ),
          Effect.provideService(ProfileRepository, {
            find: () => Effect.succeed(undefined),
            update: () => Effect.succeed(undefined),
          }),
          Effect.provideService(Authorization, {
            membership: () =>
              Effect.succeed({
                id: "member-1",
                role: "owner",
                organizationId: "org-1",
                userId: "user-1",
              }),
          })
        )
    )
  );
  expect(Result.isFailure(result)).toBe(true);
  if (Result.isFailure(result)) {
    expect(result.failure.code).toBe("NOT_FOUND");
  }
  expect(add).not.toHaveBeenCalled();
  expect(repository.getFeedbackPost).not.toHaveBeenCalled();
});

it("does not report onboarding success when the organization disappears before the write", async () => {
  repository.organizationQueries.findById.mockResolvedValue(
    organizationFixture
  );
  repository.organizationQueries.patchOnboarding.mockResolvedValue(undefined);
  for (const operation of [
    organizationOperations.initializeOnboarding,
    organizationOperations.updateOnboarding,
  ]) {
    await expect(
      executeOperation(operation, context(), {
        organizationId: "org-1",
        steps: { installWidget: true },
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  }
});

it("passes only changed onboarding steps to the atomic repository patch", async () => {
  repository.organizationQueries.findById.mockResolvedValue({
    ...organizationFixture,
    onboarding: { createApiKey: true, installWidget: false },
  });
  repository.organizationQueries.patchOnboarding.mockResolvedValue(
    organizationFixture
  );
  await expect(
    executeOperation(organizationOperations.updateOnboarding, context(), {
      organizationId: "org-1",
      steps: { installWidget: true },
    })
  ).resolves.toEqual({ success: true });
  expect(repository.organizationQueries.patchOnboarding).toHaveBeenCalledWith(
    "org-1",
    { installWidget: true }
  );
});

it("checks the active credential limit before key generation or storage", async () => {
  repository.apiKeyQueries.countActiveKeys.mockResolvedValue(10);
  await expect(
    executeOperation(apiKeyOperations.create, context(), {
      organizationId: "org-1",
      name: "Widget",
    })
  ).rejects.toMatchObject({ code: "BAD_REQUEST" });
  expect(repository.apiKeyQueries.create).not.toHaveBeenCalled();
});

it("sanitizes credential infrastructure failures at the Effect boundary", async () => {
  repository.apiKeyQueries.create.mockRejectedValue(
    new Error("private credential backend details")
  );
  await expect(
    executeOperation(apiKeyOperations.create, context(), {
      organizationId: "org-1",
      name: "Widget",
    })
  ).rejects.toMatchObject({
    code: "INTERNAL_SERVER_ERROR",
    message: "The operation could not be completed",
  });
});

it("denies voting on private feedback to authenticated nonmembers", async () => {
  repository.memberQueries.findByUserAndOrg.mockResolvedValue(undefined);
  repository.getFeedbackPost.mockResolvedValue({
    post: { ...feedbackFixture, isPublic: false },
    author: null,
  });
  await expect(
    executeOperation(feedbackOperations.vote, context(), {
      postId: "post-1",
      value: 1,
    })
  ).rejects.toMatchObject({ code: "FORBIDDEN" });
});

it("rejects stale settings revisions before writing", async () => {
  repository.organizationQueries.findById.mockResolvedValue({
    ...organizationFixture,
    settingsRevision: 3,
  });
  await expect(
    executeOperation(settingsOperations.updateSettings, context(), {
      organizationId: "org-1",
      expectedRevision: 2,
      settings: { branding: { primaryColor: "#123456" } },
    })
  ).rejects.toMatchObject({ code: "CONFLICT" });
  expect(repository.organizationQueries.update).not.toHaveBeenCalled();
});
it("returns a conflict when settings change between read and write", async () => {
  repository.organizationQueries.findById.mockResolvedValue(
    organizationFixture
  );
  repository.organizationQueries.update.mockResolvedValue(undefined);
  await expect(
    executeOperation(settingsOperations.updateSettings, context(), {
      organizationId: "org-1",
      settings: {},
    })
  ).rejects.toMatchObject({ code: "CONFLICT" });
});

it("does not grant an identified customer their matching user's workspace permissions", async () => {
  const customer = context({ isIdentified: true, identifiedOrgId: "org-1" });
  repository.getFeedbackPost.mockResolvedValue({
    post: { ...feedbackFixture, isPublic: false },
    author: null,
  });
  await expect(
    executeOperation(feedbackOperations.getById, customer, { id: "post-1" })
  ).rejects.toMatchObject({ code: "NOT_FOUND" });
  repository.getComment.mockResolvedValue({
    postId: "post-1",
    authorId: "someone-else",
  });
  await expect(
    executeOperation(feedbackOperations.deleteComment, customer, {
      id: "comment",
    })
  ).rejects.toMatchObject({ code: "FORBIDDEN" });
  repository.getFeedbackPosts.mockResolvedValue([]);
  await executeOperation(feedbackOperations.getAll, customer, {
    organizationId: "org-1",
  });
  expect(repository.getFeedbackPosts).toHaveBeenCalledWith(
    "org-1",
    expect.objectContaining({
      userId: "user-1",
      includeOrganizationPrivate: false,
    })
  );
  expect(repository.memberQueries.findByUserAndOrg).not.toHaveBeenCalled();
});
