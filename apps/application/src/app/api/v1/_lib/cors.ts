import { NextResponse } from "next/server";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key",
} as const;

export function jsonWithCors(data: unknown, status = 200) {
  return NextResponse.json(data, { status, headers: corsHeaders });
}

export function corsOptions() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}
