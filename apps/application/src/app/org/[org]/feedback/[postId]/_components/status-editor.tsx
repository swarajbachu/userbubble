"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { FeedbackStatus } from "@userbubble/db/schema";
import { Icon } from "@userbubble/ui/icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@userbubble/ui/select";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { statusConfig } from "~/components/feedback/config";
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
      <SelectTrigger className="w-54">
        <SelectValue>
          <div className="flex items-center gap-2">
            <Icon
              className={statusConfig[currentStatus].color}
              icon={statusConfig[currentStatus].icon}
              size={16}
            />
            <span className="capitalize">
              {currentStatus.replace("_", " ")}
            </span>
          </div>
        </SelectValue>
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
