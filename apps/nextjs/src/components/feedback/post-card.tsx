/** biome-ignore-all lint/nursery/noShadow: memo function pattern */
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { FeedbackPost } from "@userbubble/db/schema";
import { cn } from "@userbubble/ui";
import { Icon } from "@userbubble/ui/icon";
import Link from "next/link";
import { memo, useState, useTransition } from "react";
import { useTRPC } from "~/trpc/react";
import { categoryLabels, statusConfig } from "./config";
import { VoteButton } from "./vote-button";

type PostCardProps = {
  post: FeedbackPost;
  author: { name: string | null; image: string | null };
  org: string;
  hasUserVoted: boolean;
};

export const PostCard = memo(function PostCard({
  post,
  org,
  hasUserVoted,
}: PostCardProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [, startTransition] = useTransition();

  // Use useState - persists across re-renders
  const [voteCount, setVoteCount] = useState(post.voteCount);
  const [userHasVoted, setUserHasVoted] = useState(hasUserVoted);

  const voteMutation = useMutation(
    trpc.feedback.vote.mutationOptions({
      onSuccess: async () => {
        // Only invalidate getAll queries (includes user votes now)
        await queryClient.invalidateQueries({
          queryKey: trpc.feedback.getAll.queryKey({
            organizationId: org,
            category: post.category,
          }),
          exact: false,
        });
      },
      onError: () => {
        // Rollback on error - revert to original values
        setVoteCount(post.voteCount);
        setUserHasVoted(hasUserVoted);
      },
    })
  );

  const handleVote = () => {
    startTransition(() => {
      // Update state immediately - instant UI
      if (userHasVoted) {
        setVoteCount(voteCount - 1);
        setUserHasVoted(false);
      } else {
        setVoteCount(voteCount + 1);
        setUserHasVoted(true);
      }

      // Fire mutation
      voteMutation.mutate({
        postId: post.id,
        value: userHasVoted ? 0 : 1,
      });
    });
  };

  const config = statusConfig[post.status];

  return (
    <div className="group flex items-center gap-4 border-x border-b p-3 first:rounded-t-2xl first:border-t last:rounded-b-2xl">
      <div className="flex-none">
        <VoteButton
          className="h-6 w-auto gap-1 px-2 py-0 text-[10px]"
          hasVoted={userHasVoted}
          onVote={handleVote}
          voteCount={voteCount}
        />
      </div>

      <div className="min-w-0 flex-1">
        <Link
          className="flex items-center gap-2"
          href={`/org/${org}/feedback/${post.id}`}
        >
          <span className="truncate font-medium text-sm transition-colors group-hover:text-primary">
            {post.title}
          </span>
        </Link>
      </div>

      <div className="flex flex-none items-center gap-4 text-muted-foreground text-xs">
        <div className="hidden items-center gap-1.5 sm:flex">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              config.color.replace("text-", "bg-")
            )}
          />
          <span>{categoryLabels[post.category]}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Icon className={cn("size-3.5", config.color)} icon={config.icon} />
          <span className="capitalize">{post.status.replace("_", " ")}</span>
        </div>

        <div className="hidden w-24 justify-end sm:flex">
          {new Date(post.createdAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="size-5 rounded-full bg-linear-to-br from-primary/20 to-primary/10" />
        </div>
      </div>
    </div>
  );
});
