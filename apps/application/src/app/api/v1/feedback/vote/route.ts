import {
  executeOperation,
  feedbackOperations,
} from "@userbubble/api/management";
import type { NextRequest } from "next/server";
import { corsOptions, jsonWithCors } from "../../_lib/cors";
import { sdkContext, sdkError } from "../../_lib/operations";

export function OPTIONS() {
  return corsOptions();
}
export async function POST(request: NextRequest) {
  try {
    const { context } = await sdkContext(request, true);
    const body: unknown = await request.json();
    const data = await executeOperation(feedbackOperations.vote, context, body);
    return jsonWithCors({ data });
  } catch (error) {
    return sdkError(error);
  }
}
