import type { UserBubbleClient } from "../../packages/client/src/index";

declare const client: UserBubbleClient;

async function contractChecks() {
  const profile = await client.call("agent-1", "account.getProfile", {
    organizationId: "org-1",
  });
  const name: string = profile.name;
  // @ts-expect-error Profile responses never expose a credential.
  const password = profile.password;
  void password;
  // @ts-expect-error An organization is required even for account operations delegated to an agent.
  await client.call("agent-1", "account.getProfile", {});
  // @ts-expect-error Unknown capabilities cannot be called through the typed interface.
  await client.call("agent-1", "feedback.unknown", { organizationId: "org-1" });
  await client.call("agent-1", "feedback.update", {
    organizationId: "org-1",
    id: "post-1",
    // @ts-expect-error Revision checks require numbers, not strings.
    expectedRevision: "1",
  });
  // @ts-expect-error A reply requires content.
  await client.call("agent-1", "feedback.createComment", {
    organizationId: "org-1",
    postId: "post-1",
  });
  await client.call("agent-1", "feedback.createComment", {
    organizationId: "org-1",
    postId: "post-1",
    content: "A retry-safe reply",
    idempotencyKey: "reply-1",
  });
  await client.call("agent-1", "account.getProfile", {
    organizationId: "org-1",
    // @ts-expect-error Read operations do not accept retry keys.
    idempotencyKey: "unused-key",
  });
  await client.call("agent-1", "apiKey.create", {
    organizationId: "org-1",
    name: "SDK",
    // @ts-expect-error One-time credentials cannot replay stored responses.
    idempotencyKey: "secret-key",
  });
  const key = await client.call("agent-1", "apiKey.create", {
    organizationId: "org-1",
    name: "SDK",
    expiresAt: "2027-01-01T00:00:00Z",
  });
  const rawKey: string = key.rawKey;
  return { name, rawKey };
}
void contractChecks;
