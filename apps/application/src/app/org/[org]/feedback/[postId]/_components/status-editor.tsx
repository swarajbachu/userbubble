"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { FeedbackStatus } from "@userbubble/db/schema";
import { cn } from "@userbubble/ui";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@userbubble/ui/select";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getStatus, statuses } from "~/components/feedback/config";
import { useTRPC } from "~/trpc/react";

type StatusEditorProps = {
  postId: string;
  currentStatus: FeedbackStatus;
};

export function StatusEditor({ postId, currentStatus }: StatusEditorProps) {
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

  const current = getStatus(currentStatus);

  return (
    <Select
      disabled={updateStatus.isPending}
      onValueChange={(value) =>
        updateStatus.mutate({
          id: postId,
          status: value as FeedbackStatus,
        })
      }
      value={currentStatus}
    >
      <SelectTrigger
        className={cn(
          "h-7 w-auto gap-1.5 border-none px-2.5 font-medium text-xs shadow-none",
          current?.color
            .replace("text-", "bg-")
            .replace("-500", "-500/15")
            .replace("-400", "-400/15"),
          current?.color
        )}
      >
        <SelectValue>
          {current && (
            <div className="flex items-center gap-1.5">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  current.color.replace("text-", "bg-")
                )}
              />
              <span>{current.label}</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {statuses.map((s) => (
          <SelectItem key={s.value} value={s.value}>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  s.color.replace("text-", "bg-")
                )}
              />
              <span>{s.label}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
