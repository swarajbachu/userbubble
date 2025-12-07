"use client";

import type { FeedbackComment, User } from "@critichut/db/schema";
import { Button } from "@critichut/ui/button";
import { Icon } from "@critichut/ui/icon";
import { Delete01Icon } from "@hugeicons-pro/core-bulk-rounded";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";

type CommentItemProps = {
  comment: FeedbackComment;
  author: User | null;
  canDelete: boolean;
  onDeleted: () => void;
};

export function CommentItem({
  comment,
  author,
  canDelete,
  onDeleted,
}: CommentItemProps) {
  const trpc = useTRPC();

  const deleteComment = useMutation(
    trpc.feedback.deleteComment.mutationOptions({
      onSuccess: () => {
        toast.success("Comment deleted");
        onDeleted();
      },
      onError: () => {
        toast.error("Failed to delete comment");
      },
    })
  );

  const handleDelete = () => {
    // biome-ignore lint/suspicious/noAlert: Simple confirmation for delete action
    if (window.confirm("Delete this comment?")) {
      deleteComment.mutate({ id: comment.id });
    }
  };

  return (
    <div className="group rounded-lg border bg-card p-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="size-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/10" />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">
                {author?.name ?? "Anonymous"}
              </span>
              {comment.isTeamMember && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary text-xs">
                  Team
                </span>
              )}
            </div>
            <span className="text-muted-foreground text-xs">
              {new Date(comment.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>
        </div>

        {canDelete && (
          <Button
            className="opacity-0 group-hover:opacity-100"
            disabled={deleteComment.isPending}
            onClick={handleDelete}
            size="sm"
            variant="ghost"
          >
            <Icon icon={Delete01Icon} size={16} />
          </Button>
        )}
      </div>

      {/* Content */}
      <p className="mt-3 whitespace-pre-wrap text-sm">{comment.content}</p>
    </div>
  );
}
