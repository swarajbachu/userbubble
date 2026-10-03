import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import {
  getAgentAuthTools,
  type UserBubbleClient,
  UserBubbleTransportError,
} from "@userbubble/client";

export async function createMcpServer(client: UserBubbleClient) {
  await client.agent.init();
  const tools = getAgentAuthTools(client.agent);
  const operations = await client.capabilities();
  const server = new Server(
    { name: "userbubble", version: "0.1.0" },
    { capabilities: { tools: {} } }
  );
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      ...tools.map(({ name, description, parameters, annotations }) => ({
        name,
        description,
        inputSchema: parameters,
        annotations,
      })),
      ...operations.map((operation) => ({
        name: operation.id,
        description: operation.description,
        inputSchema: {
          type: "object" as const,
          required: ["agentId", "input"],
          additionalProperties: false,
          properties: {
            agentId: {
              type: "string",
              description: "Approved connection ID from connect_agent",
            },
            input: operation.agentInputSchema,
          },
        },
        ...(operation.responseSchema
          ? {
              outputSchema: {
                ...operation.responseSchema,
                type: "object" as const,
              },
            }
          : {}),
        annotations: {
          readOnlyHint: operation.readOnly,
          destructiveHint: operation.destructive,
          openWorldHint: false,
        },
      })),
    ],
  }));
  server.setRequestHandler(CallToolRequestSchema, async ({ params }, extra) => {
    const operation = operations.find(
      (candidate) => candidate.id === params.name
    );
    if (operation) {
      const args = params.arguments;
      if (
        typeof args?.agentId !== "string" ||
        !args.agentId ||
        !args.input ||
        typeof args.input !== "object" ||
        Array.isArray(args.input)
      ) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: JSON.stringify({
                code: "BAD_REQUEST",
                message: "Provide agentId and an input object",
              }),
            },
          ],
        };
      }
      try {
        const result = await client.execute(
          args.agentId,
          operation.id,
          args.input as Record<string, unknown>
        );
        if (!("data" in result)) {
          throw new Error("Expected a synchronous operation result");
        }
        const structuredContent = JSON.parse(
          JSON.stringify({ data: result.data })
        );
        return {
          structuredContent,
          content: [{ type: "text", text: JSON.stringify(structuredContent) }],
        };
      } catch (error) {
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: JSON.stringify({
                code:
                  error && typeof error === "object" && "code" in error
                    ? error.code
                    : "INTERNAL_SERVER_ERROR",
                message:
                  error instanceof Error ? error.message : "Operation failed",
                ...(error instanceof UserBubbleTransportError
                  ? {
                      status: error.status,
                      retryAfterSeconds: error.retryAfterSeconds,
                    }
                  : {}),
              }),
            },
          ],
        };
      }
    }
    const tool = tools.find((candidate) => candidate.name === params.name);
    if (!tool) {
      throw new Error("Unknown tool");
    }
    try {
      const result = await tool.execute(params.arguments ?? {}, {
        signal: extra.signal,
      });
      return { content: [{ type: "text", text: JSON.stringify(result) }] };
    } catch (error) {
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: error instanceof Error ? error.message : "Operation failed",
          },
        ],
      };
    }
  });
  return server;
}

export async function serveMcp(client: UserBubbleClient) {
  const server = await createMcpServer(client);
  await server.connect(new StdioServerTransport());
}
