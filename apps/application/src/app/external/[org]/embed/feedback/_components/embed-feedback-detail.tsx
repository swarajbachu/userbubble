"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@userbubble/ui";
import { Button } from "@userbubble/ui/button";
import { useState } from "react";
import { toast } from "sonner";
import { EmbedHeader } from "~/app/external/_components/embed-header";
import { categoryLabels, statusConfig } from "~/components/feedback/config";
import { VoteButton } from "~/components/feedback/vote-button";
import { useTRPC } from "~/trpc/react";

type EmbedFeedbackDetailProps = {
  postId: string;
  onBack: () => void;
};

export function EmbedFeedbackDetail({
  postId,
  onBack,
}: EmbedFeedbackDetailProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [commentText, setCommentText] = useState("");

  const { data: post, isLoading: postLoading } = useQuery(
    trpc.feedback.getById.queryOptions({ id: postId })
  );

  const { data: comments, isLoading: commentsLoading } = useQuery(
    trpc.feedback.getComments.queryOptions({ postId })
  );

  const voteMutation = useMutation(
    trpc.feedback.vote.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.feedback.pathFilter());
      },
    })
  );

  const commentMutation = useMutation(
    trpc.feedback.createComment.mutationOptions({
      onSuccess: async () => {
        setCommentText("");
        toast.success("Comment posted");
        await queryClient.invalidateQueries({
          queryKey: trpc.feedback.getComments.queryKey({ postId }),
        });
      },
      onError: () => {
        toast.error("Failed to post comment");
      },
    })
  );

  if (postLoading) {
    return (
      <div className="flex flex-col">
        <EmbedHeader onBack={onBack} title="Loading..." />
        <div className="space-y-3 p-4">
          <div className="h-6 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-20 animate-pulse rounded bg-muted" />
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="flex flex-col">
        <EmbedHeader onBack={onBack} title="Not found" />
        <div className="p-4 text-center text-muted-foreground text-sm">
          Post not found
        </div>
      </div>
    );
  }

  const config = statusConfig[post.post.status];

  return (
    <div className="flex flex-col">
      <EmbedHeader onBack={onBack} title={post.post.title} />

      <div className="overflow-y-auto p-4">
        {/* Post content */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <VoteButton
              hasVoted={post.hasUserVoted}
              onVote={() =>
                voteMutation.mutate({
                  postId: post.post.id,
                  value: post.hasUserVoted ? 0 : 1,
                })
              }
              voteCount={post.post.voteCount}
            />
            <div className="min-w-0 flex-1">
              <h2 className="font-semibold text-sm">{post.post.title}</h2>
              <div className="mt-1 flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 font-medium text-[11px]",
                    config.color
                  )}
                >
                  {post.post.status.replace("_", " ")}
                </span>
                <span className="rounded-full bg-secondary px-2 py-0.5 font-medium text-[11px] text-muted-foreground">
                  {categoryLabels[post.post.category]}
                </span>
              </div>
            </div>
          </div>

          <p className="whitespace-pre-wrap text-foreground/80 text-sm leading-relaxed">
            {post.post.description}
          </p>

          {post.author && (
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <span>{post.author.name ?? "Anonymous"}</span>
              <span>&middot;</span>
              <span>
                {new Date(post.post.createdAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </span>
            </div>
          )}
        </div>

        {/* Comments */}
        <div className="mt-6 border-t pt-4">
          <h3 className="mb-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">
            Comments ({comments?.length ?? 0})
          </h3>

          {/* Comment form */}
          <form
            className="mb-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (commentText.trim().length < 1) {
                return;
              }
              commentMutation.mutate({
                postId,
                content: commentText.trim(),
              });
            }}
          >
            <textarea
              className="w-full resize-none rounded-lg border bg-transparent p-2.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
              disabled={commentMutation.isPending}
              maxLength={2000}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              rows={2}
              value={commentText}
            />
            <div className="mt-1.5 flex justify-end">
              <Button
                disabled={
                  commentMutation.isPending || commentText.trim().length === 0
                }
                size="sm"
                type="submit"
              >
                {commentMutation.isPending ? "..." : "Post"}
              </Button>
            </div>
          </form>

          {/* Comments list */}
          <CommentsList comments={comments} isLoading={commentsLoading} />
        </div>
      </div>
    </div>
  );
}

type CommentsListProps = {
  comments:
    | Array<{
        comment: { id: string; content: string; createdAt: Date };
        author: { name: string | null } | null;
        isTeamMember: boolean;
      }>
    | undefined;
  isLoading: boolean;
};

function CommentsList({ comments, isLoading }: CommentsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div className="h-12 animate-pulse rounded bg-muted" key={i} />
        ))}
      </div>
    );
  }

  if (!comments || comments.length === 0) {
    return (
      <p className="text-center text-muted-foreground text-xs">
        No comments yet
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {comments.map((item) => (
        <div className="rounded-lg bg-secondary/30 p-3" key={item.comment.id}>
          <div className="flex items-center gap-2">
            <span className="font-medium text-xs">
              {item.author?.name ?? "Anonymous"}
            </span>
            {item.isTeamMember && (
              <span className="rounded-full bg-primary/10 px-1.5 py-0.5 font-medium text-[10px] text-primary">
                Team
              </span>
            )}
            <span className="text-[11px] text-muted-foreground">
              {new Date(item.comment.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
          <p className="mt-1 text-foreground/80 text-sm">
            {item.comment.content}
          </p>
        </div>
      ))}
    </div>
  );
}
