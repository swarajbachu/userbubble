# Connect your own agent

UserBubble stores feedback and product context. Your agent runs in your environment, uses your repository tools, and sends replies, status changes, or implementation links back to UserBubble.

## Remote MCP

Add `https://YOUR-INSTANCE/api/mcp` as an MCP server. The client discovers the OAuth provider, asks you to sign in, and requests workspace access. Review the selected workspace on the consent screen. You can change it before approving.

OAuth connections use your current workspace permissions. Removing your membership or revoking the connection removes access. Manage OAuth and Agent Auth connections in Settings → Connected agents.

## CLI and signed Agent Auth

From this monorepo, invoke the executable with Node 22.12 or later:

```sh
node packages/cli/bin/userbubble.mjs capabilities --url https://YOUR-INSTANCE --json
node packages/cli/bin/userbubble.mjs connect \
  --url https://YOUR-INSTANCE \
  --org ORGANIZATION_ID \
  --capabilities feedback.search,feedback.getById,feedback.getComments,feedback.createComment,feedback.update,reference.add \
  --json
```

Open the approval URL printed to stderr, verify the code and workspace grants, and approve. The command returns an `agentId`. Pass it explicitly on subsequent calls. Use `connections --json` to list locally stored connections.

```sh
node packages/cli/bin/userbubble.mjs call feedback.search \
  --url https://YOUR-INSTANCE --agent AGENT_ID --org ORGANIZATION_ID \
  --input '{"query":"keyboard","limit":50}' --json
```

Pass the returned `nextCursor` as `cursor` until it is null. To retrieve recently changed feedback, supply an ISO timestamp in `updatedSince`. A page may change while you read it; use incremental retrieval to reconcile concurrent edits.

Read a thread with `feedback.getById` (`id`) and `feedback.getComments` (`postId`). Post a reply with `feedback.createComment`:

```sh
node packages/cli/bin/userbubble.mjs call feedback.createComment \
  --url https://YOUR-INSTANCE --agent AGENT_ID --org ORGANIZATION_ID \
  --input '{"postId":"POST_ID","content":"The keyboard fix is ready for review.","idempotencyKey":"reply-keyboard-fix-1"}' --json
```

The same idempotency key and body return the same result. Reusing the key with a different body returns a conflict. Dashboard and cookie-authenticated API calls use the same receipt/audit boundary as delegated calls. tRPC also accepts an `Idempotency-Key` header; supply `organizationId` for organization-scoped retries. Never change the body when retrying an uncertain write. Changed membership authority rejects a cached result.

Changelog reads return `revision`; send it as `expectedRevision` when editing, publishing, linking/unlinking feedback, or deleting. Organization edits accept `expectedRevision` from `settingsRevision`. Feedback updates can include `expectedRevision` from the last read to reject stale edits. Settings updates accept `expectedRevision` from the organization’s `settingsRevision`. A stale revision returns `CONFLICT`; retrieve the organization again and reconcile the patch before retrying. Even legacy callers that omit the revision cannot overwrite a change made during their read/write window.

After implementing a change with your own tools, attach its URL using `reference.add`. Consult `/api/v2/capabilities` for each operation's current input schema and `/api/v2/openapi` for HTTP documentation.

`--input @request.json` reads a file; `--input -` reads stdin. JSON results go to stdout, errors and approval instructions to stderr. Exit codes: 0 success, 1 general/validation failure, 3 authorization/grant failure, 4 conflict, 5 rate limit/transient upstream failure. Credentials are stored under `~/.config/userbubble` with restricted file permissions; override the location using `USERBUBBLE_CONFIG_DIR`.

Remote MCP returns successful operation values in `{ "data": ... }`, both in `structuredContent` and serialized text. Every product tool advertises an `outputSchema` for this envelope. This follows the [MCP structured-result convention](https://modelcontextprotocol.io/specification/2025-06-18/server/tools#structured-content). Errors remain tool errors with `isError: true`. Local product tools use the same response envelope and discovery schemas.

## Local MCP

The local server includes a named tool for every product operation, plus Agent Auth connection tools. Call a product tool with `{ "agentId": "APPROVED_CONNECTION_ID", "input": { "organizationId": "WORKSPACE_ID", ... } }`. Keeping the connection ID outside `input` avoids confusing it with a target agent ID in connection-management operations. The server fetches capability/response schemas from your configured instance at startup. Product results have `structuredContent: { "data": ... }` and matching JSON text; authorization errors use `isError: true`.

Configure your MCP client to launch:

```sh
node /ABSOLUTE/PATH/packages/cli/bin/userbubble.mjs mcp --url https://YOUR-INSTANCE
```

The stdio transport uses the official Agent Auth discovery/connection tools and the same credential store as the CLI. Protocol messages use stdout; human-readable instructions use stderr.

The CLI and management client packages are currently private workspace packages. Do not assume an npm release exists.

### Personal profile

`account.getProfile` and `account.updateProfile` operate on the authorizing user's own profile. The profile is shared across that user's workspaces. Agents still need an organization-bound grant and current membership to execute these capabilities. Installation/embed identities cannot use them. Name and image are the only mutable fields; email and credentials are outside this operation.

```sh
userbubble connect --org org_123 --capabilities account.getProfile,account.updateProfile
userbubble call account.getProfile --agent AGENT_ID --org org_123 --json
userbubble call account.updateProfile --agent AGENT_ID --org org_123 --input '{"name":"Alex Smith","image":null}' --json
```

Pass `null` to clear the image. Omitted fields remain unchanged. Blank names, invalid URLs, and empty updates return validation errors.

## Review and cancel invitations

Connect with `organization.invite`, `organization.listInvitations`, and `organization.cancelInvitation` grants. The delegating user must currently be an owner or admin of the selected organization. These operations create and manage pending invitation records. The recipient accepts using their own authenticated session through `POST /api/auth/organization/accept-invitation` with `{ "invitationId": "..." }`. This identity-bound Better Auth ceremony rejects another user and cancelled invitations; it does not use an installation key or an owner’s agent credentials. Automatic email delivery is not configured; the owner or their external agent must share the invitation details through their own channel. The recipient-facing approval screen remains part of the UI handoff.

```sh
node packages/cli/bin/userbubble.mjs call organization.invite \
  --url https://YOUR-INSTANCE --agent AGENT_ID --org ORGANIZATION_ID \
  --input '{"email":"colleague@example.com","role":"member"}' --json

node packages/cli/bin/userbubble.mjs call organization.listInvitations \
  --url https://YOUR-INSTANCE --agent AGENT_ID --org ORGANIZATION_ID \
  --input '{}' --json

node packages/cli/bin/userbubble.mjs call organization.cancelInvitation \
  --url https://YOUR-INSTANCE --agent AGENT_ID --org ORGANIZATION_ID \
  --input '{"invitationId":"INVITATION_ID"}' --json
```

Cancellation is organization-bound and repeatable. An invitation already accepted or otherwise no longer cancellable returns a conflict; cancellation never removes an accepted member. Member removal is a separate operation with its own authorization.

## Attach external implementation work

After doing repository work in your own environment, attach the resulting URL to its feedback thread. The dashboard shows these links in the thread sidebar; workspace members can also add or remove them there. UserBubble stores the reference and does not fetch or execute the linked repository.

```sh
node packages/cli/bin/userbubble.mjs call reference.add \
  --url https://YOUR-INSTANCE --agent AGENT_ID --org ORGANIZATION_ID \
  --input '{"postId":"POST_ID","title":"Keyboard navigation fix","url":"https://example.com/pull/42","idempotencyKey":"implementation-42"}' --json
node packages/cli/bin/userbubble.mjs call reference.list \
  --url https://YOUR-INSTANCE --agent AGENT_ID --org ORGANIZATION_ID \
  --input '{"postId":"POST_ID"}' --json
```

Request the corresponding capabilities when connecting. References are bound to their feedback thread and organization. New references require HTTP or HTTPS URLs; migrated historical records preserve nullable authorship. `activity.list` returns the latest 100 organization events, including delegated operations; complete pagination and audit coverage remain unfinished.


## Filter releases

`changelog.getAll` accepts `tags`, inclusive `dateFrom`/`dateTo` ISO timestamps, `limit`, and `offset`. Tags match any supplied tag. Date filtering uses publication time, falling back to creation time for drafts. Filters apply before pagination, and equal timestamps use the release ID as a stable tie-breaker. Non-admin readers still see only published entries. Offset pagination can shift when concurrent writes occur; cursor-based release pagination remains future work.

```sh
userbubble call changelog.getAll --agent "$AGENT_ID" --org "$ORG_ID" --input '{"tags":["feature"],"dateFrom":"2026-01-01T00:00:00Z","dateTo":"2026-12-31T23:59:59Z","limit":20,"offset":0}' --json
```

## Manage widget installation keys

Use `apiKey.create` with an owner/admin connection to create an installation key. Its `rawKey` is returned only on creation; subsequent reads contain masked metadata. Installation keys authorize SDK access, not management operations.

```sh
node packages/cli/bin/userbubble.mjs call apiKey.create \
  --url https://YOUR-INSTANCE --agent AGENT_ID --org ORGANIZATION_ID \
  --input '{"name":"Website widget","expiresAt":"2030-01-01T00:00:00.000Z"}' --json
node packages/cli/bin/userbubble.mjs call apiKey.toggleActive \
  --url https://YOUR-INSTANCE --agent AGENT_ID --org ORGANIZATION_ID \
  --input '{"id":"KEY_ID","isActive":false}' --json
```

Omit `expiresAt` or set it to null for no expiration. ISO date strings and epoch milliseconds are supported over JSON. Names are trimmed and must contain 1–50 characters; descriptions allow up to 200 characters. Revoking or restoring a key takes effect on subsequent SDK requests.

## Organizations and invitations

Organization slugs are normalized to lowercase and must use 3–50 letters, digits or hyphens without leading/trailing hyphens. Reserved application routes cannot be used as slugs. Creation assigns ownership to the authenticated user.

```sh
node packages/cli/bin/userbubble.mjs call organization.checkSlug \
  --url https://YOUR-INSTANCE --agent AGENT_ID --org ORGANIZATION_ID \
  --input '{"slug":"example-team"}' --json
node packages/cli/bin/userbubble.mjs call organization.invite \
  --url https://YOUR-INSTANCE --agent AGENT_ID --org ORGANIZATION_ID \
  --input '{"email":"teammate@example.test"}' --json
```

An omitted invitation role defaults to `member`; admins may explicitly request `admin`. Invitation creation requires owner/admin authority. The response records a pending invitation. Recipient acceptance, email matching and cancellation are covered by the live invitation regression. Automatic email delivery requires a separately configured delivery integration; creating an invitation does not claim an email was sent.

Settings updates are patches within each section. For example, `{"settings":{"branding":{"primaryColor":"#123456"}}}` changes only the primary color and preserves saved accent/logo values. Omitted fields retain their values; explicit booleans and empty lists replace the corresponding values. Use `expectedRevision` from `settingsRevision` for concurrent-edit protection.

## Typed client and incremental reads

`@userbubble/client` exports generated `OperationId`, `OperationInput`, `OperationOutput`, and `OperationTypes` for every catalog operation. `client.call` checks operation names, required fields, and output types at compile time. It uses the same authenticated Agent Auth execution path as the CLI and local MCP. The dynamic `execute` method remains available for capability-driven tools.

```ts
const profile = await client.call(agentId, "account.getProfile", {
  organizationId,
});
for await (const page of client.feedbackPages(agentId, {
  organizationId,
  status: ["open", "under_review"],
  limit: 50,
})) {
  for (const thread of page.items) {
    // Read comments or implement changes in your own repository environment.
    console.log(thread.post.id, thread.post.title);
  }
}
await client.call(agentId, "feedback.createComment", {
  organizationId,
  postId,
  content: "Implemented in https://github.com/example/project/pull/123",
  idempotencyKey: "reply-for-pr-123",
});
```

The iterator requests the next page only when consumed, preserves timestamp precision, and stops when the consumer breaks. Dates in generated output types are ISO strings. Type generation runs with `pnpm client:generate`; `pnpm client:check` rejects stale contracts and compiles negative type fixtures. CI runs this check alongside capability discovery consistency.

### Rate limits and transient failures

The management client preserves HTTP 429 as `rate_limited`, and 502/503/504 as `transient_failure`. CLI errors and local MCP tool errors carry the HTTP status and optional `retryAfterSeconds`; CLI exits with code 5. No automatic write retry occurs. Honor Retry-After, reuse supported idempotency keys for uncertain write outcomes, and reread before resolving revision conflicts.
