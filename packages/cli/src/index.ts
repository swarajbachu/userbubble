const AUTH_ERROR_PATTERN =
  /unauthorized|forbidden|revoked|expired|constraint_violated/i;
const CONFLICT_ERROR_PATTERN = /conflict/i;

import { readFile } from "node:fs/promises";
import { parseArgs } from "node:util";
import { UserBubbleClient, UserBubbleTransportError } from "@userbubble/client";
import { serveMcp } from "./mcp.js";
import { credentialStorage } from "./storage.js";

async function readStdin() {
  let value = "";
  for await (const chunk of process.stdin) {
    value += String(chunk);
  }
  return value;
}

const help = `userbubble <connect|capabilities|call|connections|disconnect|mcp> [operation]
  --url URL              UserBubble instance (or USERBUBBLE_URL)
  --org ID               Organization scope
  --capabilities LIST    Comma-separated grants; * requests all existing capabilities
  --agent ID             Connected agent ID
  --input JSON           JSON input, @filename, or - for stdin
  --json                 Machine-readable output
  --help                 Show this help

Examples:
  userbubble capabilities --url https://app.userbubble.com --json
  userbubble connect --org org_123 --capabilities feedback.getAll,feedback.createComment
  userbubble call feedback.createComment --agent ID --org org_123 --input '{"postId":"post_123","content":"Thanks!"}' --json
  userbubble mcp --url https://app.userbubble.com
`;
async function main() {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      url: { type: "string" },
      org: { type: "string" },
      capabilities: { type: "string" },
      agent: { type: "string" },
      input: { type: "string" },
      json: { type: "boolean" },
      help: { type: "boolean" },
    },
  });
  if (values.help || !positionals[0]) {
    process.stdout.write(help);
    return;
  }
  const storage = credentialStorage();
  const client = new UserBubbleClient(
    values.url ?? process.env.USERBUBBLE_URL ?? "https://app.userbubble.com",
    {
      storage,
      onApprovalRequired: (info) => {
        process.stderr.write(
          `Approve this connection in your browser:\n${JSON.stringify({ method: info.method, ...("verification_uri_complete" in info ? { url: info.verification_uri_complete } : {}), ...("user_code" in info ? { code: info.user_code } : {}) })}\n`
        );
      },
    }
  );
  const output = (data: unknown) =>
    process.stdout.write(
      `${JSON.stringify(data, null, values.json ? undefined : 2)}\n`
    );
  const command = positionals[0];
  if (command === "mcp") {
    await serveMcp(client);
    return;
  }
  try {
    if (command === "capabilities") {
      output(await client.capabilities());
      return;
    }
    if (command === "connections") {
      output(
        (await storage.listAgentConnections()).map(
          ({ agentId, issuer, providerName }) => ({
            agentId,
            issuer,
            providerName,
          })
        )
      );
      return;
    }
    if (command === "connect") {
      if (!(values.org && values.capabilities)) {
        throw new Error("connect requires --org and --capabilities");
      }
      const capabilities =
        values.capabilities === "*"
          ? (await client.capabilities()).map(({ id }) => id)
          : values.capabilities.split(",");
      const connection = await client.connect(values.org, capabilities);
      output({
        agentId: connection.agentId,
        status: connection.status,
        hostId: connection.hostId,
      });
      return;
    }
    if (!values.agent) {
      throw new Error("--agent is required; use connections to list agent IDs");
    }
    if (command === "disconnect") {
      await client.agent.disconnectAgent(values.agent);
      output({ success: true });
      return;
    }
    if (command !== "call" || !positionals[1] || !values.org) {
      throw new Error("call requires an operation name, --agent, and --org");
    }
    const raw = values.input ?? "{}";
    let source = raw;
    if (raw.startsWith("@")) {
      source = await readFile(raw.slice(1), "utf8");
    } else if (raw === "-") {
      source = await readStdin();
    }
    const input: unknown = JSON.parse(source);
    if (!input || typeof input !== "object" || Array.isArray(input)) {
      throw new Error("Input must be a JSON object");
    }
    output(
      await client.execute(values.agent, positionals[1], {
        ...input,
        organizationId: values.org,
      })
    );
  } finally {
    client.agent.destroy();
  }
}
main().catch((error: unknown) => {
  const code =
    error && typeof error === "object" && "code" in error
      ? String(error.code)
      : "CLI_ERROR";
  process.stderr.write(
    `${JSON.stringify({ error: { code, message: error instanceof Error ? error.message : "Command failed", ...(error instanceof UserBubbleTransportError ? { status: error.status, retryAfterSeconds: error.retryAfterSeconds } : {}) } })}\n`
  );
  process.exitCode = 1;
  if (error instanceof UserBubbleTransportError) {
    process.exitCode = 5;
  } else if (AUTH_ERROR_PATTERN.test(code)) {
    process.exitCode = 3;
  } else if (CONFLICT_ERROR_PATTERN.test(code)) {
    process.exitCode = 4;
  }
});
