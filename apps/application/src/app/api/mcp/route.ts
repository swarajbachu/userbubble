import { requireMcpAuth } from "@better-auth/mcp";
import {
  createMcpHandler,
  fromJsonSchema,
  type JsonSchemaType,
  McpServer,
} from "@modelcontextprotocol/server";
import {
  ApplicationError,
  describeOperations,
  executeDelegatedOperation,
  responseJsonSchema,
  serverReads,
} from "@userbubble/api/management";
import { auth } from "~/auth/server";

export const runtime = "nodejs";
const handler = requireMcpAuth(
  auth,
  async (request, claims) => {
    const requestId = crypto.randomUUID();
    const userId = claims.sub;
    const clientId = claims.client_id;
    const organizationId = claims.organizationId;
    if (
      typeof userId !== "string" ||
      typeof clientId !== "string" ||
      typeof organizationId !== "string" ||
      typeof claims.iat !== "number" ||
      !(await serverReads.activeOAuth(
        userId,
        clientId,
        organizationId,
        claims.iat
      ))
    ) {
      return Response.json(
        {
          error: "invalid_token",
          message: "Connection revoked or no longer authorized",
        },
        { status: 401 }
      );
    }
    const issuedAt = claims.iat;
    const mcp = createMcpHandler(
      () => {
        const server = new McpServer({ name: "userbubble", version: "2.0.0" });
        for (const operation of describeOperations()) {
          server.registerTool(
            operation.id,
            {
              description: operation.description,
              inputSchema: fromJsonSchema<Record<string, unknown>>({
                ...operation.agentInputSchema,
                // Validators cache by schema ID; workspace-specific constants need distinct IDs.
                $id: `${operation.agentInputSchema.$id}:organization:${encodeURIComponent(organizationId)}`,
                required: operation.agentInputSchema.required.filter(
                  (key) => key !== "organizationId"
                ),
                properties: {
                  ...operation.agentInputSchema.properties,
                  organizationId: { type: "string", const: organizationId },
                },
              } as JsonSchemaType),
              ...(operation.outputSchema
                ? {
                    outputSchema: fromJsonSchema(
                      responseJsonSchema(operation.outputSchema, operation.id)
                    ),
                  }
                : {}),
              annotations: {
                readOnlyHint: operation.readOnly,
                destructiveHint: operation.destructive,
                openWorldHint: false,
              },
            },
            async (input) => {
              try {
                if (
                  input.organizationId &&
                  input.organizationId !== organizationId
                ) {
                  throw new ApplicationError({ code: "FORBIDDEN" });
                }
                // Check consent on each execution, including multi-message requests.
                if (
                  !(await serverReads.activeOAuth(
                    userId,
                    clientId,
                    organizationId,
                    issuedAt
                  ))
                ) {
                  throw new ApplicationError({ code: "UNAUTHORIZED" });
                }
                const result = await executeDelegatedOperation(
                  auth,
                  { userId, agentId: `oauth:${clientId}` },
                  { id: operation.id, requestId },
                  { ...input, organizationId }
                );
                // Normalize dates and other JSON values before MCP validates the wire shape.
                const structuredContent = JSON.parse(
                  JSON.stringify({ data: result, requestId })
                );
                return {
                  structuredContent,
                  content: [
                    { type: "text", text: JSON.stringify(structuredContent) },
                  ],
                };
              } catch (error) {
                return {
                  isError: true,
                  content: [
                    {
                      type: "text",
                      text: JSON.stringify(
                        error instanceof ApplicationError
                          ? { code: error.code, message: error.message }
                          : {
                              code: "INTERNAL_SERVER_ERROR",
                              message: "Operation failed",
                            }
                      ),
                    },
                  ],
                };
              }
            }
          );
        }
        return server;
      },
      { legacy: "stateless" }
    );
    return mcp.fetch(request);
  },
  {
    resource: `${auth.options.baseURL}/api/mcp`,
    requiredScopes: ["userbubble:manage"],
  }
);
export { handler as GET, handler as POST, handler as DELETE };
