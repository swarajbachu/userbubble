"use client";

import { Button } from "@critichut/ui/button";
import { Icon } from "@critichut/ui/icon";
import {
  Delete01Icon,
  PencilEdit01Icon,
} from "@hugeicons-pro/core-bulk-rounded";
import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";
import { EditPostDialog } from "./edit-post-dialog";

type PostActionsProps = {
  postId: string;
  org: string;
};

export function PostActions({ postId, org }: PostActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
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
      },
    })
  );

  const handleDelete = () => {
    // biome-ignore lint/suspicious/noAlert: Simple confirmation for delete action
    if (window.confirm("Are you sure you want to delete this post?")) {
      setIsDeleting(true);
      deletePost.mutate({ id: postId });
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Button
          onClick={() => setEditDialogOpen(true)}
          size="sm"
          variant="outline"
        >
          <Icon icon={PencilEdit01Icon} size={16} />
          Edit
        </Button>

        <Button
          disabled={isDeleting}
          onClick={handleDelete}
          size="sm"
          variant="destructive"
        >
          <Icon icon={Delete01Icon} size={16} />
          Delete
        </Button>
      </div>

      <EditPostDialog
        onOpenChange={setEditDialogOpen}
        open={editDialogOpen}
        postId={postId}
      />
    </>
  );
}
