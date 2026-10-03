import { Client } from "pg";
import { describe, expect, it } from "vitest";

const connectionString =
  process.env.TEST_MIGRATION_DATABASE_URL ?? process.env.TEST_DATABASE_URL;
const local =
  connectionString &&
  /^postgres(?:ql)?:\/\/[^/]*@(localhost|127\.0\.0\.1)(:\d+)?\//.test(
    connectionString
  );
describe.skipIf(!local)("PostgreSQL invariants", () => {
  it("keeps migration content and removes the retired execution tables", async () => {
    const client = new Client({ connectionString });
    await client.connect();
    try {
      const references = await client.query(
        "select url from feedback_reference where post_id = $1",
        ["fixture-post"]
      );
      expect(references.rows).toContainEqual({
        url: "https://example.test/pull/1",
      });
      const comments = await client.query(
        "select content, is_ai_generated from feedback_comment where id = $1",
        ["fixture-comment"]
      );
      expect(comments.rows).toEqual([
        { content: "Preserve provenance", is_ai_generated: true },
      ]);
      const retired = await client.query(
        "select to_regclass('public.pr_generation_job') as jobs, to_regclass('public.organization_api_key') as credentials"
      );
      expect(retired.rows).toEqual([{ jobs: null, credentials: null }]);
    } finally {
      await client.end();
    }
  });
});
