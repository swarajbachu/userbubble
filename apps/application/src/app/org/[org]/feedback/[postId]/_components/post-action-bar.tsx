"use client";

import {
  CancelCircleIcon,
  CheckmarkCircle01Icon,
  Clock01Icon,
  Progress02Icon,
  RotateClockwiseIcon,
} from "@hugeicons-pro/core-bulk-rounded";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { FeedbackStatus } from "@userbubble/db/schema";
import { Button } from "@userbubble/ui/button";
import { Icon } from "@userbubble/ui/icon";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";

type PostActionBarProps = {
  postId: string;
  currentStatus: FeedbackStatus;
};

const NEXT_STATUS: Record<
  FeedbackStatus,
  { label: string; value: FeedbackStatus; icon: typeof Clock01Icon }
> = {
  open: { label: "Mark Planned", value: "planned", icon: Clock01Icon },
  under_review: { label: "Mark Planned", value: "planned", icon: Clock01Icon },
  planned: {
    label: "Mark In Progress",
    value: "in_progress",
    icon: Progress02Icon,
  },
  in_progress: {
    label: "Mark Completed",
    value: "completed",
    icon: CheckmarkCircle01Icon,
  },
  completed: { label: "Reopen", value: "open", icon: RotateClockwiseIcon },
  closed: { label: "Reopen", value: "open", icon: RotateClockwiseIcon },
};

export function PostActionBar({ postId, currentStatus }: PostActionBarProps) {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const updateStatus = useMutation(
    trpc.feedback.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.feedback.getById.queryKey({ id: postId }),
        });
        toast.success("Status updated");
        router.refresh();
      },
      onError: () => {
        toast.error("Failed to update status");
      },
    })
  );

  const next = NEXT_STATUS[currentStatus];
  const showClose = currentStatus !== "closed" && currentStatus !== "completed";

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex justify-center">
      <div className="pointer-events-auto flex items-center gap-2 rounded-full border bg-background/80 px-3 py-2 shadow-lg backdrop-blur-md">
        {showClose && (
          <Button
            disabled={updateStatus.isPending}
            onClick={() =>
              updateStatus.mutate({ id: postId, status: "closed" })
            }
            size="sm"
            variant="ghost"
          >
            <Icon className="text-red-400" icon={CancelCircleIcon} size={16} />
            Close
          </Button>
        )}
        <Button
          disabled={updateStatus.isPending}
          onClick={() =>
            updateStatus.mutate({ id: postId, status: next.value })
          }
          size="sm"
        >
          <Icon icon={next.icon} size={16} />
          {next.label}
        </Button>
      </div>
    </div>
  );
}
