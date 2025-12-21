"use client";

import { Delete01Icon } from "@hugeicons-pro/core-bulk-rounded";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@userbubble/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@userbubble/ui/dialog";
import { Icon } from "@userbubble/ui/icon";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";

type PostActionsProps = {
  postId: string;
  org: string;
};

export function PostActions({ postId, org }: PostActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const router = useRouter();
  const trpc = useTRPC();

  const deletePost = useMutation(
    trpc.feedback.delete.mutationOptions({
      onSuccess: async () => {
        toast.success("Post deleted");
        router.push(`/org/${org}/feedback`);
      },
      onError: () => {
        toast.error("Failed to delete post");
        setIsDeleting(false);
        setDeleteDialogOpen(false);
      },
    })
  );

  const handleDelete = () => {
    setIsDeleting(true);
    deletePost.mutate({ id: postId });
  };

  return (
    <>
      <Button
        className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
        onClick={() => setDeleteDialogOpen(true)}
        size="icon"
        variant="ghost"
      >
        <Icon icon={Delete01Icon} size={16} />
        <span className="sr-only">Delete Post</span>
      </Button>

      <Dialog onOpenChange={setDeleteDialogOpen} open={deleteDialogOpen}>
        <DialogPopup className="pt-4 sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this post? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              disabled={isDeleting}
              onClick={handleDelete}
              variant="destructive"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </>
  );
}
