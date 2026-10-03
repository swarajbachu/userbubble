import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import Ajv2020 from "ajv/dist/2020";
import { afterEach, expect, it, vi } from "vitest";
import { describeOperations } from "../packages/api/src/application/catalog";
import { createMcpServer } from "../packages/cli/src/mcp";
import { UserBubbleClient } from "../packages/client/src/index";

afterEach(() => vi.restoreAllMocks());

it("exposes product contracts and structured results through the local MCP protocol", async () => {
  const application = new UserBubbleClient("http://localhost:3000");
  vi.spyOn(application.agent, "init").mockResolvedValue();
  vi.spyOn(application, "capabilities").mockResolvedValue(describeOperations());
  const execute = vi
    .spyOn(application, "execute")
    .mockResolvedValue({ data: [] });
  const server = await createMcpServer(application);
  const client = new Client({ name: "local-protocol-test", version: "1.0.0" });
  const [clientTransport, serverTransport] =
    InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  await client.connect(clientTransport);
  try {
    const { tools } = await client.listTools();
    for (const operation of describeOperations()) {
      expect(
        tools.find(({ name }) => name === operation.id)?.outputSchema
      ).toEqual(operation.responseSchema);
    }
    expect(tools.some(({ name }) => name === "connect_agent")).toBe(true);
    const reply = tools.find(({ name }) => name === "feedback.createComment");
    const validateReply = new Ajv2020().compile(reply?.inputSchema ?? {});
    expect(
      validateReply({
        agentId: "approved-agent",
        input: {
          organizationId: "org-1",
          postId: "post-1",
          content: "Reply",
          idempotencyKey: "reply-1",
        },
      })
    ).toBe(true);
    expect(
      validateReply({
        agentId: "approved-agent",
        input: { postId: "post-1", content: "Reply" },
      })
    ).toBe(false);
    const result = await client.callTool({
      name: "apiKey.list",
      arguments: {
        agentId: "approved-agent",
        input: { organizationId: "org-1" },
      },
    });
    expect(result.isError).not.toBe(true);
    expect(result.structuredContent).toEqual({ data: [] });
    expect(result.content).toEqual([{ type: "text", text: '{"data":[]}' }]);
    expect(execute).toHaveBeenCalledWith("approved-agent", "apiKey.list", {
      organizationId: "org-1",
    });
    execute.mockClear();
    const invalid = await client.callTool({
      name: "apiKey.list",
      arguments: { input: {} },
    });
    expect(invalid.isError).toBe(true);
    expect(execute).not.toHaveBeenCalled();
    execute.mockRejectedValue(
      Object.assign(new Error("Connection revoked"), { code: "unauthorized" })
    );
    const denied = await client.callTool({
      name: "apiKey.list",
      arguments: { agentId: "revoked", input: { organizationId: "org-1" } },
    });
    expect(denied.isError).toBe(true);
    expect(denied.content).toEqual([
      {
        type: "text",
        text: JSON.stringify({
          code: "unauthorized",
          message: "Connection revoked",
        }),
      },
    ]);
  } finally {
    await client.close();
    await server.close();
  }
});

const localUrl = process.env.TEST_APP_URL ?? "";
const localInstance = /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(localUrl);
it.skipIf(!localInstance)(
  "starts the CLI stdio process and discovers live product schemas",
  async () => {
    const directory = await mkdtemp(join(tmpdir(), "userbubble-mcp-"));
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [
        resolve("packages/cli/bin/userbubble.mjs"),
        "mcp",
        "--url",
        localUrl,
      ],
      env: { USERBUBBLE_CONFIG_DIR: directory },
      stderr: "pipe",
    });
    const client = new Client({ name: "stdio-process-test", version: "1.0.0" });
    try {
      await client.connect(transport);
      const { tools } = await client.listTools();
      const products = tools.filter(({ name }) => name.includes("."));
      expect(products).toHaveLength(describeOperations().length);
      expect(
        products.every((tool) => tool.outputSchema?.type === "object")
      ).toBe(true);
      const result = await client.callTool({
        name: "reference.list",
        arguments: {
          agentId: "no-approved-connection",
          input: { organizationId: "org-1", postId: "post-1" },
        },
      });
      expect(result.isError).toBe(true);
    } finally {
      await client.close();
      await transport.close();
      await rm(directory, { recursive: true, force: true });
    }
  },
  30_000
);
