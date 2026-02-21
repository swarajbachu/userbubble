"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PrJobStatus } from "@userbubble/db/schema";
import { Badge } from "@userbubble/ui/badge";
import { Button } from "@userbubble/ui/button";
import { useEffect } from "react";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";

const STATUS_STEPS: { key: PrJobStatus; label: string }[] = [
  { key: "pending", label: "Queued" },
  { key: "cloning", label: "Cloning repo" },
  { key: "analyzing", label: "Analyzing codebase" },
  { key: "implementing", label: "Implementing" },
  { key: "creating_pr", label: "Creating PR" },
  { key: "completed", label: "Complete" },
];

const ACTIVE_STATUSES: PrJobStatus[] = [
  "pending",
  "cloning",
  "analyzing",
  "implementing",
  "creating_pr",
];

function getStepIndex(status: PrJobStatus): number {
  const idx = STATUS_STEPS.findIndex((s) => s.key === status);
  return idx >= 0 ? idx : 0;
}

type PrJobStatusProps = {
  jobId: string;
  organizationId: string;
  isAdmin: boolean;
};

export function PrJobStatusView({
  jobId,
  organizationId,
  isAdmin,
}: PrJobStatusProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: job } = useQuery({
    ...trpc.automation.getJobStatus.queryOptions({
      organizationId,
      jobId,
    }),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status && ACTIVE_STATUSES.includes(status)) {
        return 3000;
      }
      return false;
    },
  });

  const cancelMutation = useMutation(
    trpc.automation.cancelJob.mutationOptions({
      onSuccess: () => {
        toast.success("Job cancelled");
        queryClient.invalidateQueries();
      },
      onError: (error) => {
        toast.error(error.message);
      },
    })
  );

  // Stop polling notification when job is done
  useEffect(() => {
    if (job?.status === "completed" && job.prUrl) {
      toast.success("PR created successfully!");
    }
    if (job?.status === "failed") {
      toast.error("PR generation failed");
    }
  }, [job?.status, job?.prUrl]);

  if (!job) {
    return null;
  }

  const isActive = ACTIVE_STATUSES.includes(job.status);
  const currentStep = getStepIndex(job.status);
  const progressLog = (job.progressLog ?? []) as Array<{
    ts: string;
    message: string;
  }>;

  return (
    <div className="space-y-3">
      {/* Status stepper */}
      <div className="space-y-1">
        {STATUS_STEPS.map((step, idx) => {
          const isCompleted = idx < currentStep;
          const isCurrent = idx === currentStep && isActive;
          const isCurrentCompleted =
            job.status === "completed" && idx === STATUS_STEPS.length - 1;

          let dotColor = "bg-muted";
          if (isCompleted || isCurrentCompleted) {
            dotColor = "bg-green-500";
          } else if (isCurrent) {
            dotColor = "bg-blue-500 animate-pulse";
          }

          return (
            <div className="flex items-center gap-2" key={step.key}>
              <div className={`size-2 rounded-full ${dotColor}`} />
              <span
                className={`text-xs ${
                  isCompleted || isCurrent || isCurrentCompleted
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Final status badges */}
      {job.status === "completed" && job.prUrl && (
        <div className="space-y-2">
          <Badge variant="outline">PR Created</Badge>
          <a
            className="block truncate text-blue-500 text-xs hover:underline"
            href={job.prUrl}
            rel="noopener noreferrer"
            target="_blank"
          >
            {job.prUrl}
          </a>
        </div>
      )}

      {job.status === "failed" && (
        <div className="space-y-1">
          <Badge variant="destructive">Failed</Badge>
          {job.errorMessage && (
            <p className="text-destructive text-xs">{job.errorMessage}</p>
          )}
        </div>
      )}

      {job.status === "cancelled" && (
        <Badge variant="secondary">Cancelled</Badge>
      )}

      {/* Progress log */}
      {progressLog.length > 0 && (
        <div className="max-h-32 overflow-y-auto rounded border bg-muted/50 p-2">
          {progressLog.map((entry) => (
            <div className="text-muted-foreground text-xs" key={entry.ts}>
              <span className="font-mono">
                {new Date(entry.ts).toLocaleTimeString()}
              </span>{" "}
              {entry.message}
            </div>
          ))}
        </div>
      )}

      {/* Cancel button */}
      {isActive && isAdmin && (
        <Button
          disabled={cancelMutation.isPending}
          onClick={() => cancelMutation.mutate({ organizationId, jobId })}
          size="sm"
          variant="outline"
        >
          {cancelMutation.isPending ? "Cancelling..." : "Cancel"}
        </Button>
      )}
    </div>
  );
}
