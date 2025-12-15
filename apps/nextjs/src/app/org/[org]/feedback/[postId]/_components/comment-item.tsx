"use client";

import { Delete01Icon } from "@hugeicons-pro/core-bulk-rounded";
import { useMutation } from "@tanstack/react-query";
import type { FeedbackComment, User } from "@userbubble/db/schema";
import { Button } from "@userbubble/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@userbubble/ui/dialog";
import { Icon } from "@userbubble/ui/icon";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";

type CommentItemProps = {
  comment: FeedbackComment;
  author: User | null;
  canDelete: boolean;
  isTeamMember: boolean;
  onDeleted: () => void;
};

export function CommentItem({
  comment,
  author,
  canDelete,
  isTeamMember,
  onDeleted,
}: CommentItemProps) {
  const trpc = useTRPC();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const deleteComment = useMutation(
    trpc.feedback.deleteComment.mutationOptions({
      onSuccess: () => {
        toast.success("Comment deleted");
        onDeleted();
        setDeleteDialogOpen(false);
      },
      onError: () => {
        toast.error("Failed to delete comment");
      },
    })
  );

  const handleDelete = () => {
    deleteComment.mutate({ id: comment.id });
  };

  return (
    <>
      <div className="group py-2">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="size-8 rounded-full bg-linear-to-br from-primary/20 to-primary/10" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">
                  {author?.name ?? "Anonymous"}
                </span>
                {isTeamMember && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary text-xs">
                    Team
                  </span>
                )}
                <span className="text-muted-foreground text-xs">
                  •{" "}
                  {new Date(comment.createdAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-foreground/90 text-sm">
                {comment.content}
              </p>
            </div>
          </div>

          {canDelete && (
            <Button
              className="opacity-0 transition-opacity group-hover:opacity-100"
              onClick={() => setDeleteDialogOpen(true)}
              size="sm"
              variant="ghost"
            >
              <Icon icon={Delete01Icon} size={16} />
            </Button>
          )}
        </div>
      </div>

      <Dialog onOpenChange={setDeleteDialogOpen} open={deleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Comment</DialogTitle>
          </DialogHeader>
          <DialogDescription className="p-4 text-foreground text-xl">
            Are you sure you want to delete this comment? This action cannot be
            undone.
          </DialogDescription>
          <DialogFooter>
            <DialogClose>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button
              disabled={deleteComment.isPending}
              onClick={handleDelete}
              variant="destructive"
            >
              {deleteComment.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
