import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { account, base, fixtureFetch, local } from "./helpers/live";

const databaseUrl = process.env.TEST_DATABASE_URL;
const localDatabase =
  databaseUrl &&
  /^postgres(?:ql)?:\/\/[^/]*@(localhost|127\.0\.0\.1)(:\d+)?\//.test(
    databaseUrl
  );

describe.skipIf(!(local && localDatabase))("shared direct execution", () => {
  let observer: Client;
  beforeAll(async () => {
    observer = new Client({ connectionString: databaseUrl });
    await observer.connect();
  });
  afterAll(async () => {
    await observer?.end();
  });

  it(
    "deduplicates simultaneous dashboard/API replies and records correlated user activity",
    { timeout: 90_000 },
    async () => {
      const workspace = await account();
      const { organizationId, call, headers } = workspace;
      const created = await (
        await call("/api/v2/operations/feedback.create", {
          organizationId,
          title: "Shared execution",
          description: "Retry fixture",
          category: "bug",
        })
      ).json();
      const input = {
        organizationId,
        postId: created.data.id,
        content: "One reply across transports",
        idempotencyKey: "shared-reply",
      };
      const api = () =>
        call("/api/v2/operations/feedback.createComment", input);
      const dashboard = () =>
        fixtureFetch(`${base}/api/trpc/feedback.createComment?batch=1`, {
          method: "POST",
          headers,
          body: JSON.stringify({ 0: { json: input } }),
        });
      const [firstResponse, secondResponse] = await Promise.all([
        api(),
        dashboard(),
      ]);
      expect(firstResponse.status).toBe(200);
      expect(secondResponse.status).toBe(200);
      const first = await firstResponse.json();
      const second = (await secondResponse.json())[0].result.data;
      expect(first.data.comment.id).toBe(second.json.comment.id);
      // SuperJSON must receive a restored Date on a cached response, not a string.
      const replayResponse = await dashboard();
      const replay = (await replayResponse.json())[0].result.data;
      expect(replay.json.comment.id).toBe(first.data.comment.id);
      expect(replay.meta.values["comment.createdAt"]).toEqual(["Date"]);
      const activity = (
        await observer.query(
          "select * from activity where organization_id=$1 and operation='feedback.createComment' order by created_at",
          [organizationId]
        )
      ).rows;
      expect(activity).toHaveLength(3);
      expect(
        activity.every(
          (row) =>
            row.outcome === "success" &&
            row.agent_id === null &&
            typeof row.actor_id === "string"
        )
      ).toBe(true);
      expect(activity.some((row) => row.request_id === first.requestId)).toBe(
        true
      );
      const conflict = await call("/api/v2/operations/feedback.createComment", {
        ...input,
        content: "Changed retry body",
      });
      expect(conflict.status).toBe(409);
      const deniedCredential = await call("/api/v2/operations/apiKey.create", {
        organizationId,
        name: "One-time secret",
        idempotencyKey: "must-not-store",
      });
      expect(deniedCredential.status).toBe(400);
      const receipts = await observer.query(
        "select result from operation_receipt where organization_id=$1",
        [organizationId]
      );
      expect(receipts.rows).toHaveLength(1);
      expect(JSON.stringify(receipts.rows)).not.toContain("rawKey");
    }
  );

  it(
    "rejects cached results after authority changes and never executes a changed retry",
    { timeout: 90_000 },
    async () => {
      const { organizationId, call } = await account();
      const input = {
        organizationId,
        title: "Authority-bound reply",
        description: "Permission snapshot",
        category: "bug",
        idempotencyKey: "authority",
      };
      expect(
        (await call("/api/v2/operations/feedback.create", input)).status
      ).toBe(200);
      await observer.query(
        "update member set role='member' where organization_id=$1",
        [organizationId]
      );
      const replay = await call("/api/v2/operations/feedback.create", input);
      expect(replay.status).toBe(409);
      expect(
        (
          await observer.query(
            "select id from feedback_post where organization_id=$1",
            [organizationId]
          )
        ).rowCount
      ).toBe(1);
    }
  );

  it(
    "returns actionable conflicts for stale release edits and publication",
    { timeout: 90_000 },
    async () => {
      const { organizationId, call } = await account();
      const created = await (
        await call("/api/v2/operations/changelog.create", {
          organizationId,
          title: "Revision API",
          description: "Release revision fixture",
        })
      ).json();
      const input = {
        organizationId,
        id: created.data.id,
        expectedRevision: created.data.revision,
      };
      expect(created.data.revision).toBe(1);
      const updated = await call("/api/v2/operations/changelog.update", {
        ...input,
        title: "Edited release",
      });
      expect(updated.status).toBe(200);
      expect((await updated.json()).data.revision).toBe(2);
      for (const operation of [
        "changelog.update",
        "changelog.publish",
        "changelog.delete",
      ]) {
        const stale = await call(`/api/v2/operations/${operation}`, input);
        expect(stale.status).toBe(409);
        expect((await stale.json()).error.message).toContain("latest revision");
      }
      const published = await call("/api/v2/operations/changelog.publish", {
        ...input,
        expectedRevision: 2,
      });
      expect(published.status).toBe(200);
      expect((await published.json()).data).toMatchObject({
        revision: 3,
        isPublished: true,
      });
    }
  );

  it(
    "rolls back the mutation and receipt when its success audit fails",
    { timeout: 90_000 },
    async () => {
      const { organizationId, call } = await account();
      // A row-specific trigger fails only this disposable fixture's successful audit.
      await observer.query(
        `create or replace function test_reject_success_audit() returns trigger language plpgsql as $$ begin if new.organization_id = '${organizationId}' and new.operation = 'feedback.create' and new.outcome = 'success' then raise exception 'injected audit failure'; end if; return new; end $$`
      );
      await observer.query(
        "create trigger test_reject_success_audit before insert on activity for each row execute function test_reject_success_audit()"
      );
      try {
        const response = await call("/api/v2/operations/feedback.create", {
          organizationId,
          title: "Must roll back with audit",
          description: "Atomic audit rollback",
          category: "bug",
          idempotencyKey: "audit-failure",
        });
        expect(response.status).toBe(500);
        expect(
          (
            await observer.query(
              "select id from feedback_post where organization_id=$1",
              [organizationId]
            )
          ).rowCount
        ).toBe(0);
        expect(
          (
            await observer.query(
              "select id from operation_receipt where organization_id=$1",
              [organizationId]
            )
          ).rowCount
        ).toBe(0);
        expect(
          (
            await observer.query(
              "select outcome from activity where organization_id=$1 and operation='feedback.create'",
              [organizationId]
            )
          ).rows
        ).toEqual([{ outcome: "failure" }]);
      } finally {
        await observer.query(
          "drop trigger test_reject_success_audit on activity"
        );
        await observer.query("drop function test_reject_success_audit()");
      }
    }
  );
});
