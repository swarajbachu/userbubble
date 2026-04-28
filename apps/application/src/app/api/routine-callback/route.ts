import { prJobQueries } from "@userbubble/db/queries";
import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const callbackSchema = z.object({
  jobId: z.string().min(1),
  status: z.enum(["completed", "failed"]),
  prUrl: z.string().optional(),
  branchName: z.string().optional(),
  error: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const secret = process.env.ROUTINE_CALLBACK_SECRET;
    if (!secret) {
      return NextResponse.json(
        { error: "Callback not configured" },
        { status: 500 }
      );
    }

    // Validate bearer token
    const authHeader = request.headers.get("Authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token || token !== secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = callbackSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      jobId,
      status,
      prUrl,
      branchName,
      error: errorMessage,
    } = parsed.data;

    // Verify job exists
    const job = await prJobQueries.getById(jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    // Update job status
    await prJobQueries.updateStatus(jobId, status, {
      prUrl,
      branchName,
      errorMessage,
    });

    await prJobQueries.appendProgress(
      jobId,
      status === "completed"
        ? `PR created: ${prUrl ?? "unknown"}`
        : `Failed: ${errorMessage ?? "unknown error"}`
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[routine-callback] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
