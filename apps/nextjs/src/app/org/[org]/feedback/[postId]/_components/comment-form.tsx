"use client";

import type { FeedbackComment, User } from "@critichut/db/schema";
import { cn } from "@critichut/ui";
import { Button } from "@critichut/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
        className
      )}
      {...props}
    />
  );
}

type CommentFormProps = {
  postId: string;
  onCommentAdded: (newComment: {
    comment: FeedbackComment;
    author: User | null;
    isTeamMember: boolean;
  }) => void;
};

export function CommentForm({ postId, onCommentAdded }: CommentFormProps) {
  const [content, setContent] = useState("");
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const createComment = useMutation(
    trpc.feedback.createComment.mutationOptions({
      onSuccess: async (newComment) => {
        toast.success("Comment posted");
        setContent("");
        onCommentAdded(newComment);

        // Invalidate queries
        await queryClient.invalidateQueries({
          queryKey: trpc.feedback.getComments.queryKey({ postId }),
        });
      },
      onError: () => {
        toast.error("Failed to post comment");
      },
    })
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (content.trim().length < 1) {
      toast.error("Comment cannot be empty");
      return;
    }

    createComment.mutate({
      postId,
      content: content.trim(),
    });
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <Textarea
        disabled={createComment.isPending}
        maxLength={2000}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add a comment..."
        rows={3}
        value={content}
      />

      <div className="flex justify-between">
        <span className="text-muted-foreground text-xs">
          {content.length} / 2000
        </span>

        <Button
          disabled={createComment.isPending || content.trim().length === 0}
          type="submit"
        >
          {createComment.isPending ? "Posting..." : "Post Comment"}
        </Button>
      </div>
    </form>
  );
}
