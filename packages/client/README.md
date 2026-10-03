# UserBubble management client

Typed access to the same Effect application operations used by the dashboard. Requires Node 22.12 or newer. This workspace package is built with `pnpm build`; it is not yet published.

```ts
import { UserBubbleClient } from "@userbubble/client";

const client = new UserBubbleClient("https://app.userbubble.com", {
  onApprovalRequired(info) {
    if ("verification_uri_complete" in info) {
      console.log(info.verification_uri_complete);
    }
  },
});
const connection = await client.connect("YOUR_ORGANIZATION_ID", [
  "feedback.search",
  "feedback.createComment",
  "reference.add",
]);

try {
  for await (const page of client.feedbackPages(connection.agentId, {
    organizationId: "YOUR_ORGANIZATION_ID",
    query: "keyboard",
    limit: 50,
  })) {
    for (const thread of page.items) console.log(thread.post);
  }

  await client.call(connection.agentId, "feedback.createComment", {
    organizationId: "YOUR_ORGANIZATION_ID",
    postId: "YOUR_POST_ID",
    content: "Implemented in the linked pull request.",
    idempotencyKey: "reply-for-pr-42",
  });
} finally {
  client.agent.destroy();
}
```

Persist connections using an Agent Auth storage adapter; the CLI supplies a filesystem adapter. Never share its private keys or use SDK installation keys as management credentials.

Use `capabilities()` for descriptions, schemas, permissions and destructive-action metadata. All 50 operation input/output types are generated from the server contracts. Dates use ISO strings over the wire.

`UserBubbleTransportError` distinguishes `rate_limited` (429) from `transient_failure` (502/503/504), with HTTP status and optional `retryAfterSeconds`. The client does not automatically repeat writes. Retry rate-limited calls after the indicated delay; for ambiguous write failures reuse the same supported idempotency key. Reconcile revision conflicts using a fresh read.

Executable examples covering every operation are in `tests/capability-workflows.test.ts`. They require a disposable local application and PostgreSQL database. See the repository's `docs/agent-access.md` for authorization and deployment details.
