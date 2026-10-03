import { describeOperations } from "@userbubble/api/management";
export function GET() {
  return Response.json({
    capabilities: describeOperations().map((operation) => ({
      ...operation,
      inputSchema: operation.agentInputSchema,
    })),
  });
}
