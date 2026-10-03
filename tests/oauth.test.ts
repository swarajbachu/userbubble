import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const url = process.env.TEST_DATABASE_URL;
const local =
  url &&
  /^postgres(?:ql)?:\/\/[^/]*@(localhost|127\.0\.0\.1)(:\d+)?\//.test(url);
describe.skipIf(!local)("OAuth connection authorization", () => {
  let client: Client;
  beforeAll(async () => {
    process.env.DATABASE_URL = url;
    client = new Client({ connectionString: url });
    await client.connect();
    await client.query(
      `INSERT INTO "user" (id,name,email) VALUES ('oauth-user','OAuth','oauth@test.example') ON CONFLICT DO NOTHING`
    );
    await client.query(
      `INSERT INTO oauth_client (id,client_id,name,redirect_uris) VALUES ('oauth-client','oauth-client','Test agent',ARRAY['http://localhost/callback']) ON CONFLICT DO NOTHING`
    );
    await client.query(`DELETE FROM oauth_consent WHERE id='oauth-consent'`);
    await client.query(
      `INSERT INTO oauth_consent (id,user_id,client_id,reference_id,scopes,created_at,updated_at) VALUES ('oauth-consent','oauth-user','oauth-client','oauth-org',ARRAY['userbubble:manage'],now(),now())`
    );
  });
  afterAll(async () => {
    if (client) {
      await client.end();
    }
  });
  it("binds consent to its user, client and organization", async () => {
    const { oauthConnectionQueries: q } = await import(
      "../packages/db/src/agent/oauth.queries"
    );
    const now = Math.floor(Date.now() / 1000);
    expect(await q.active("oauth-user", "oauth-client", "oauth-org", now)).toBe(
      true
    );
    expect(
      await q.active("another-user", "oauth-client", "oauth-org", now)
    ).toBe(false);
    expect(
      await q.active("oauth-user", "another-client", "oauth-org", now)
    ).toBe(false);
    expect(
      await q.active("oauth-user", "oauth-client", "another-org", now)
    ).toBe(false);
    expect(
      await q.active("oauth-user", "oauth-client", "oauth-org", now - 100)
    ).toBe(false);
  });
  it("denies revocation by another user and invalidates a revoked connection immediately", async () => {
    const { oauthConnectionQueries: q } = await import(
      "../packages/db/src/agent/oauth.queries"
    );
    expect(await q.revoke("another-user", "oauth-consent")).toBe(false);
    expect(await q.revoke("oauth-user", "oauth-consent")).toBe(true);
    expect(
      await q.active(
        "oauth-user",
        "oauth-client",
        "oauth-org",
        Math.floor(Date.now() / 1000)
      )
    ).toBe(false);
  });
});
