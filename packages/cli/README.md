# UserBubble CLI and local MCP

Build from the workspace with `pnpm build`, then run:

```sh
node packages/cli/bin/userbubble.mjs --help
node packages/cli/bin/userbubble.mjs capabilities --url https://app.userbubble.com --json
node packages/cli/bin/userbubble.mjs connect --url https://app.userbubble.com --org YOUR_ORG --capabilities feedback.search,feedback.createComment,reference.add
```

Approve the printed connection URL once. Use the resulting agent ID for noninteractive calls:

```sh
node packages/cli/bin/userbubble.mjs call feedback.search --org YOUR_ORG --agent YOUR_AGENT --input '{"query":"keyboard","limit":50}' --json
node packages/cli/bin/userbubble.mjs call feedback.createComment --org YOUR_ORG --agent YOUR_AGENT --input @reply.json --json
```

The input file contains the operation fields and, for retryable writes, an `idempotencyKey`. `--input -` reads JSON from stdin. Follow `feedback.search`'s `nextCursor` until null. Use `--capabilities '*'` to request every currently available operation.

Exit codes: 0 success, 1 input/operation failure, 3 authorization failure, 4 conflict, 5 rate limit or transient upstream failure. Errors are JSON on stderr. Exit 5 includes HTTP status and an optional `retryAfterSeconds`. Writes are never automatically repeated.

`USERBUBBLE_URL` sets the default application origin. `USERBUBBLE_CONFIG_DIR` selects the credential directory. Credential files contain private signing keys; do not commit or print them.

For local MCP, configure a client to run `node packages/cli/bin/userbubble.mjs mcp --url YOUR_APP_URL`. Its product tools accept an agent ID and operation input. Remote MCP is available at `YOUR_APP_URL/api/mcp` using OAuth with PKCE and workspace consent. Both interfaces recheck membership and revocation on execution.

These packages remain private workspace packages until release. Do not assume a new npm version has been published.
