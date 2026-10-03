import {
  ApplicationError,
  executeIdentification,
} from "@userbubble/api/management";
import { isValidApiKeyFormat } from "@userbubble/auth";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, X-API-Key",
} as const;

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

const identifySchema = z.object({
  id: z.string().min(1, "User ID is required"),
  email: z.string().email("Valid email is required"),
  name: z.string().optional(),
  avatar: z.string().optional(),
});

/**
 * Platform-Agnostic Identify Endpoint
 * POST /api/identify
 *
 * Works for ALL platforms: React Native, Web, Desktop, APIs!
 * Authenticates users using API keys and creates identified user records
 */
function jsonResponse(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    // 1. Extract and validate API key from header
    const apiKeyHeader = request.headers.get("X-API-Key");

    if (!apiKeyHeader) {
      return jsonResponse({ error: "Missing X-API-Key header" }, 401);
    }

    // 2. Validate API key format
    if (!isValidApiKeyFormat(apiKeyHeader)) {
      return jsonResponse({ error: "Invalid API key format" }, 401);
    }

    // 3. Parse request body
    const body = await request.json();
    const validation = identifySchema.safeParse(body);

    if (!validation.success) {
      return jsonResponse(
        {
          error: "Invalid request body",
          details: validation.error.flatten().fieldErrors,
        },
        400
      );
    }

    return jsonResponse(
      await executeIdentification(apiKeyHeader, validation.data)
    );
  } catch (error) {
    if (error instanceof ApplicationError && error.code === "UNAUTHORIZED") {
      return jsonResponse({ error: error.message }, 401);
    }
    return jsonResponse({ error: "Internal server error" }, 500);
  }
}
