"use client";

import type { FeedbackStatus } from "@critichut/db/schema";
import { Icon } from "@critichut/ui/icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@critichut/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";
import { statusConfig } from "../../config";

type StatusEditorProps = {
  postId: string;
  currentStatus: FeedbackStatus;
};

export function StatusEditor({ postId, currentStatus }: StatusEditorProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const updateStatus = useMutation(
    trpc.feedback.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.feedback.getById.queryKey({ id: postId }),
        });
        toast.success("Status updated");
      },
      onError: () => {
        toast.error("Failed to update status");
      },
    })
  );

  const config = statusConfig[currentStatus];

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
      <SelectTrigger className="w-auto gap-2 border-none bg-secondary/50">
        <Icon className={config.color} icon={config.icon} size={16} />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(statusConfig).map(([status, cfg]) => (
          <SelectItem key={status} value={status}>
            <div className="flex items-center gap-2">
              <Icon className={cfg.color} icon={cfg.icon} size={16} />
              <span className="capitalize">{status.replace("_", " ")}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
