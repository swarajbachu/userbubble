import { Effect, Result } from "effect";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import {
  ApplicationError,
  applicationError,
} from "../packages/api/src/application/errors";
import { DelegationRepository } from "../packages/api/src/application/repositories/delegation";

const url = process.env.TEST_DATABASE_URL;
const local =
  url &&
  /^postgres(?:ql)?:\/\/[^/]*@(localhost|127\.0\.0\.1)(:\d+)?\//.test(url);
describe.skipIf(!local)("transaction invariants", () => {
  let client: Client;
  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    client = new Client({ connectionString: url });
    await client.connect();
    await client.query(
      `INSERT INTO "user" (id,name,email) VALUES ('tx-owner-a','A','a@tx.test'),('tx-owner-b','B','b@tx.test') ON CONFLICT DO NOTHING`
    );
    await client.query(
      `INSERT INTO organization (id,name,slug) VALUES ('tx-org','Transactions','tx-org') ON CONFLICT DO NOTHING`
    );
    await client.query(
      `INSERT INTO member (id,organization_id,user_id,role) VALUES ('tx-member-a','tx-org','tx-owner-a','owner'),('tx-member-b','tx-org','tx-owner-b','owner') ON CONFLICT (id) DO UPDATE SET role='owner'`
    );
    await client.query(
      "DELETE FROM operation_receipt WHERE organization_id='tx-org'"
    );
    await client.query(
      "DELETE FROM feedback_post WHERE organization_id='tx-org'"
    );
  });
  afterAll(async () => {
    if (client) {
      await client.end();
    }
  });
  it("cancels invitations only in their tenant and preserves accepted invitations", async () => {
    const { invitationQueries } = await import(
      "../packages/db/src/org/organization.queries"
    );
    await client.query(`INSERT INTO invitation (id,organization_id,email,role,status,expires_at,inviter_id)
      VALUES ('tx-invite','tx-org','invite@tx.test','member','pending',now()+interval '1 day','tx-owner-a')
      ON CONFLICT (id) DO UPDATE SET status='pending'`);
    expect(
      await invitationQueries.cancel("tx-invite", "another-org")
    ).toBeUndefined();
    expect(
      (await invitationQueries.cancel("tx-invite", "tx-org"))?.status
    ).toBe("cancelled");
    expect(
      (await invitationQueries.cancel("tx-invite", "tx-org"))?.status
    ).toBe("cancelled");
    await client.query(
      "UPDATE invitation SET status='accepted' WHERE id='tx-invite'"
    );
    expect(
      await invitationQueries.cancel("tx-invite", "tx-org")
    ).toBeUndefined();
    expect(
      (await client.query("SELECT status FROM invitation WHERE id='tx-invite'"))
        .rows[0].status
    ).toBe("accepted");
  });
  it("merges concurrent onboarding steps and never resets progress on initialization", async () => {
    const { organizationQueries } = await import(
      "../packages/db/src/org/organization.queries"
    );
    await client.query(
      "update organization set onboarding = null where id = 'tx-org'"
    );
    await Promise.all([
      organizationQueries.patchOnboarding("tx-org", { createApiKey: true }),
      organizationQueries.patchOnboarding("tx-org", { installWidget: true }),
      organizationQueries.patchOnboarding("tx-org", {}),
    ]);
    const initialized = await organizationQueries.patchOnboarding("tx-org", {});
    expect(initialized?.onboarding).toMatchObject({
      createApiKey: true,
      installWidget: true,
      shareBoard: false,
    });
    expect(
      (
        await organizationQueries.patchOnboarding("tx-org", {
          installWidget: false,
        })
      )?.onboarding
    ).toMatchObject({ createApiKey: true, installWidget: false });
  });
  it("serializes competing final-owner demotions", async () => {
    const { memberQueries } = await import(
      "../packages/db/src/org/organization.queries"
    );
    const results = await Promise.all([
      memberQueries.changeMembership({
        organizationId: "tx-org",
        actorId: "tx-owner-a",
        memberId: "tx-member-a",
        role: "member",
      }),
      memberQueries.changeMembership({
        organizationId: "tx-org",
        actorId: "tx-owner-b",
        memberId: "tx-member-b",
        role: "member",
      }),
    ]);
    expect(results.filter((result) => result.success)).toHaveLength(1);
    expect(
      results.filter((result) => result.error === "CONFLICT")
    ).toHaveLength(1);
    expect(
      (
        await client.query(
          "SELECT id FROM member WHERE organization_id='tx-org' AND role='owner'"
        )
      ).rowCount
    ).toBe(1);
  });
  it("executes concurrent idempotent writes once and rejects a changed body", async () => {
    const { withReceipt } = await import(
      "../packages/db/src/agent/activity.queries"
    );
    const { createFeedbackPost } = await import(
      "../packages/db/src/feedback/feedback.queries"
    );
    let executions = 0;
    const options = {
      actorId: "tx-owner-a",
      organizationId: "tx-org",
      operation: "feedback.create",
      key: "repeat",
      input: { title: "One" },
    };
    const work = async () => {
      executions += 1;
      const post = await createFeedbackPost({
        organizationId: "tx-org",
        title: "One",
        description: "Once",
      });
      if (!post) {
        throw new Error("Test feedback creation failed");
      }
      return { id: post.id };
    };
    const results = await Promise.all([
      withReceipt(options, work),
      withReceipt(options, work),
    ]);
    expect(executions).toBe(1);
    expect(results[0]).toEqual(results[1]);
    await expect(
      withReceipt({ ...options, input: { title: "Different" } }, work)
    ).rejects.toMatchObject({ code: "CONFLICT" });
  });
  it("rolls back the product write and receipt together", async () => {
    const { withReceipt } = await import(
      "../packages/db/src/agent/activity.queries"
    );
    const { createFeedbackPost } = await import(
      "../packages/db/src/feedback/feedback.queries"
    );
    await expect(
      withReceipt(
        {
          actorId: "tx-owner-a",
          organizationId: "tx-org",
          operation: "feedback.create",
          key: "rollback",
          input: {},
        },
        async () => {
          await createFeedbackPost({
            organizationId: "tx-org",
            title: "Rolled back",
            description: "Must not persist",
          });
          throw new Error("Injected failure");
        }
      )
    ).rejects.toThrow("Injected failure");
    expect(
      (
        await client.query(
          "SELECT id FROM feedback_post WHERE title='Rolled back' AND organization_id='tx-org'"
        )
      ).rowCount
    ).toBe(0);
    expect(
      (
        await client.query(
          "SELECT id FROM operation_receipt WHERE organization_id='tx-org'"
        )
      ).rowCount
    ).toBe(1);
  });
  it("allows only one update at a given revision", async () => {
    const { createFeedbackPost, updateFeedbackPost } = await import(
      "../packages/db/src/feedback/feedback.queries"
    );
    const post = await createFeedbackPost({
      organizationId: "tx-org",
      title: "Revision test",
      description: "Concurrent editing",
    });
    if (!post) {
      throw new Error("Test feedback creation failed");
    }
    const results = await Promise.all([
      updateFeedbackPost(post.id, { title: "First editor" }, post.revision),
      updateFeedbackPost(post.id, { title: "Second editor" }, post.revision),
    ]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect(results.find(Boolean)?.revision).toBe(post.revision + 1);
  });
  it("rejects stale release edits, publishing, links and deletion atomically", async () => {
    const {
      createChangelogEntry,
      saveChangelogEntry,
      publishChangelogEntry,
      getChangelogEntry,
      linkFeedbackToChangelog,
      unlinkFeedbackFromChangelog,
      deleteChangelogEntry,
      ChangelogRevisionConflict,
    } = await import("../packages/db/src/changelog/changelog.queries");
    const { createFeedbackPost } = await import(
      "../packages/db/src/feedback/feedback.queries"
    );
    const entry = await createChangelogEntry({
      organizationId: "tx-org",
      authorId: "tx-owner-a",
      title: "Concurrent release",
      description: "Release revision fixture",
    });
    if (!entry) {
      throw new Error("Missing release fixture");
    }
    const results = await Promise.all([
      saveChangelogEntry(entry.id, "tx-org", {
        title: "New content",
        expectedRevision: entry.revision,
      }),
      publishChangelogEntry(entry.id, entry.revision),
    ]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect((await getChangelogEntry(entry.id))?.revision).toBe(
      entry.revision + 1
    );
    const post = await createFeedbackPost({
      organizationId: "tx-org",
      title: "Release link",
      description: "Linked feedback fixture",
    });
    if (!post) {
      throw new Error("Missing post fixture");
    }
    await expect(
      linkFeedbackToChangelog(entry.id, [post.id], entry.revision)
    ).rejects.toBeInstanceOf(ChangelogRevisionConflict);
    await linkFeedbackToChangelog(
      entry.id,
      [post.id, post.id],
      entry.revision + 1
    );
    expect((await getChangelogEntry(entry.id))?.linkedFeedback).toHaveLength(1);
    await expect(
      unlinkFeedbackFromChangelog(entry.id, [post.id], entry.revision + 1)
    ).rejects.toBeInstanceOf(ChangelogRevisionConflict);
    expect(await deleteChangelogEntry(entry.id, entry.revision)).toBe(false);
    expect((await getChangelogEntry(entry.id))?.revision).toBe(
      entry.revision + 2
    );
    await unlinkFeedbackFromChangelog(entry.id, [post.id], entry.revision + 2);
    expect(await deleteChangelogEntry(entry.id, entry.revision + 3)).toBe(true);
  });
  it("paginates matching feedback without duplicates and supports incremental retrieval", async () => {
    const { createFeedbackPost, searchFeedback } = await import(
      "../packages/db/src/feedback/feedback.queries"
    );
    const since = new Date();
    for (let i = 0; i < 5; i++) {
      await createFeedbackPost({
        organizationId: "tx-org",
        title: `Pagination ${i}`,
        description: "Search fixture",
      });
    }
    const ids: string[] = [];
    let cursor: { updatedAt: string; id: string } | undefined;
    do {
      const page = await searchFeedback("tx-org", {
        query: "Pagination",
        limit: 2,
        cursor,
        updatedSince: since,
      });
      ids.push(...page.items.map(({ post }) => post.id));
      cursor = page.nextCursor ?? undefined;
    } while (cursor);
    expect(ids).toHaveLength(5);
    expect(new Set(ids).size).toBe(5);
    expect(
      (await searchFeedback("another-org", { query: "Pagination", limit: 2 }))
        .items
    ).toHaveLength(0);
  });
  it("commits release publication atomically and rolls back broken references", async () => {
    const { createChangelogEntry, saveChangelogEntry, getChangelogEntry } =
      await import("../packages/db/src/changelog/changelog.queries");
    const entry = await createChangelogEntry({
      organizationId: "tx-org",
      authorId: "tx-owner-a",
      title: "Draft",
      description: "Original",
      version: "1.0",
      tags: ["Old"],
    });
    if (!entry) {
      throw new Error("Missing release fixture");
    }
    await expect(
      saveChangelogEntry(entry.id, "tx-org", {
        title: "Must roll back",
        publish: true,
        feedbackPostIds: ["missing-feedback"],
      })
    ).rejects.toThrow();
    expect(await getChangelogEntry(entry.id)).toMatchObject({
      title: "Draft",
      isPublished: false,
    });
    await expect(
      saveChangelogEntry(entry.id, "foreign-org", {
        title: "Wrong tenant",
        publish: true,
      })
    ).resolves.toBeUndefined();
    await saveChangelogEntry(entry.id, "tx-org", {
      title: "Published content",
      description: "Final body",
      version: null,
      tags: [],
      feedbackPostIds: [],
      publish: true,
    });
    expect(await getChangelogEntry(entry.id)).toMatchObject({
      title: "Published content",
      description: "Final body",
      version: null,
      tags: [],
      linkedFeedback: [],
      isPublished: true,
    });
  });
  it("filters release tags and dates before pagination with deterministic ties", async () => {
    const { getChangelogEntries } = await import(
      "../packages/db/src/changelog/changelog.queries"
    );
    await client.query(
      "DELETE FROM changelog_entry WHERE id LIKE 'tx-filter-%'"
    );
    for (const [id, tag, date] of [
      ["tx-filter-newest", "other", "2026-03-01"],
      ["tx-filter-b", "match", "2026-02-01"],
      ["tx-filter-a", "match", "2026-02-01"],
      ["tx-filter-old", "match", "2025-01-01"],
    ]) {
      await client.query(
        `INSERT INTO changelog_entry (id,organization_id,author_id,title,description,tags,is_published,published_at,created_at) VALUES ($1,'tx-org','tx-owner-a','Filter fixture','Body',ARRAY[$2]::text[],true,$3,$3)`,
        [id, tag, date]
      );
    }
    const filters = {
      published: true,
      tags: ["match"],
      dateFrom: new Date("2026-01-01"),
      dateTo: new Date("2026-02-01"),
      limit: 1,
    };
    expect(
      (await getChangelogEntries("tx-org", filters)).map(({ id }) => id)
    ).toEqual(["tx-filter-b"]);
    expect(
      (await getChangelogEntries("tx-org", { ...filters, offset: 1 })).map(
        ({ id }) => id
      )
    ).toEqual(["tx-filter-a"]);
    expect(
      await getChangelogEntries("tx-org", { ...filters, offset: 2 })
    ).toEqual([]);
    expect(await getChangelogEntries("another-org", filters)).toEqual([]);
  });
  it("preserves rollback, context and concurrent receipts across the Effect bridge", async () => {
    const { delegationRepositoryLive } = await import(
      "../packages/api/src/infrastructure/delegation"
    );
    const { createFeedbackPost } = await import(
      "../packages/db/src/feedback/feedback.queries"
    );
    const options = {
      actorId: "tx-owner-a",
      organizationId: "tx-org",
      operation: "effect.bridge",
      key: "effect-bridge",
      input: { title: "Effect transaction" },
    };
    let executions = 0;
    const write = Effect.tryPromise({
      try: () => {
        executions += 1;
        return createFeedbackPost({
          organizationId: "tx-org",
          title: "Effect transaction",
          description: "Atomic effect",
        });
      },
      catch: applicationError,
    });
    const run = (fail: boolean) =>
      Effect.runPromise(
        Effect.gen(function* () {
          const repository = yield* DelegationRepository;
          return yield* repository.withReceipt(
            options,
            Effect.gen(function* () {
              const post = yield* write;
              // A dependency resolved inside the transaction must retain the caller's context.
              const id = yield* (yield* DelegationRepository).uuid;
              if (fail) {
                return yield* new ApplicationError({
                  code: "CONFLICT",
                  message: "Injected rollback",
                });
              }
              return { id: post?.id, requestId: id };
            })
          );
        }).pipe(Effect.provide(delegationRepositoryLive), Effect.result)
      );
    const failed = await run(true);
    expect(Result.isFailure(failed) && failed.failure.code).toBe("CONFLICT");
    expect(
      (
        await client.query(
          "SELECT id FROM feedback_post WHERE organization_id='tx-org' AND title='Effect transaction'"
        )
      ).rowCount
    ).toBe(0);
    expect(
      (
        await client.query(
          "SELECT id FROM operation_receipt WHERE organization_id='tx-org' AND operation='effect.bridge'"
        )
      ).rowCount
    ).toBe(0);
    const [first, second] = await Promise.all([run(false), run(false)]);
    expect(Result.isSuccess(first)).toBe(true);
    expect(first).toEqual(second);
    expect(executions).toBe(2); // One rolled back attempt and one committed attempt.
    expect(
      (
        await client.query(
          "SELECT id FROM feedback_post WHERE organization_id='tx-org' AND title='Effect transaction'"
        )
      ).rowCount
    ).toBe(1);
  });
  it("enforces the active-key quota across competing creates and reactivations", async () => {
    const { apiKeyQueries } = await import(
      "../packages/db/src/org/api-key.queries"
    );
    await client.query("DELETE FROM api_key WHERE organization_id='tx-org'");
    for (let i = 0; i < 9; i++) {
      await apiKeyQueries.create({
        organizationId: "tx-org",
        name: `Key ${i}`,
        keyHash: `quota-${i}`,
        keyPreview: "...test",
      });
    }
    const dormant = await apiKeyQueries.create({
      organizationId: "tx-org",
      name: "Dormant",
      keyHash: "quota-dormant",
      keyPreview: "...test",
      isActive: false,
    });
    if (!dormant) {
      throw new Error("Missing key fixture");
    }
    const results = await Promise.allSettled([
      apiKeyQueries.create({
        organizationId: "tx-org",
        name: "Competing",
        keyHash: "quota-competing",
        keyPreview: "...test",
      }),
      apiKeyQueries.toggleActive(dormant.id, true),
      apiKeyQueries.create({
        organizationId: "tx-org",
        name: "Competing two",
        keyHash: "quota-competing-2",
        keyPreview: "...test",
      }),
    ]);
    expect(
      results.filter((result) => result.status === "fulfilled")
    ).toHaveLength(1);
    expect(
      results.filter((result) => result.status === "rejected")
    ).toHaveLength(2);
    expect(await apiKeyQueries.countActiveKeys("tx-org")).toBe(10);
    const active = (await apiKeyQueries.listByOrganization("tx-org")).find(
      (key) => key.isActive
    );
    if (!active) {
      throw new Error("Missing active key");
    }
    await expect(
      apiKeyQueries.toggleActive(active.id, true)
    ).resolves.toMatchObject({ isActive: true });
    await apiKeyQueries.toggleActive(active.id, false);
    await expect(
      apiKeyQueries.create({
        organizationId: "tx-org",
        name: "Replacement",
        keyHash: "quota-replacement",
        keyPreview: "...test",
      })
    ).resolves.toBeDefined();
    expect(await apiKeyQueries.countActiveKeys("tx-org")).toBe(10);
  });
  it("allows only one settings update for the same revision", async () => {
    const { organizationQueries } = await import(
      "../packages/db/src/org/organization.queries"
    );
    const org = await organizationQueries.findById("tx-org");
    if (!org) {
      throw new Error("Missing org fixture");
    }
    const results = await Promise.all([
      organizationQueries.update(
        org.id,
        { metadata: '{"branding":{"primaryColor":"#123456"}}' },
        org.settingsRevision
      ),
      organizationQueries.update(
        org.id,
        { metadata: '{"branding":{"primaryColor":"#abcdef"}}' },
        org.settingsRevision
      ),
    ]);
    expect(results.filter(Boolean)).toHaveLength(1);
    expect((await organizationQueries.findById(org.id))?.settingsRevision).toBe(
      org.settingsRevision + 1
    );
  });
  it("upserts concurrent customer identities and preserves existing user links", async () => {
    const { identifiedUserQueries } = await import(
      "../packages/db/src/user/identified-user.queries"
    );
    await client.query(
      "DELETE FROM identified_user WHERE organization_id='tx-org' AND external_id='concurrent-customer'"
    );
    const input = {
      organizationId: "tx-org",
      externalId: "concurrent-customer",
      email: "customer@tx.test",
      name: "Customer",
      userId: "tx-owner-a",
    };
    const [first, second] = await Promise.all([
      identifiedUserQueries.upsert({ ...input, id: "tx-identified-a" }),
      identifiedUserQueries.upsert({ ...input, id: "tx-identified-b" }),
    ]);
    expect(first?.id).toBe(second?.id);
    const refreshed = await identifiedUserQueries.upsert({
      ...input,
      id: "tx-identified-c",
      userId: null,
      name: "Updated customer",
    });
    expect(refreshed).toMatchObject({
      id: first?.id,
      userId: "tx-owner-a",
      name: "Updated customer",
    });
  });
});
