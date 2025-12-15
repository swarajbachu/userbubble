"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { FeedbackPost } from "@userbubble/db/schema";
import { cn } from "@userbubble/ui";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";
import { categoryLabels } from "../feedback/config";
import { VoteButton } from "../feedback/vote-button";

type RoadmapCardProps = {
  post: FeedbackPost;
  author: { name: string | null; image: string | null } | null;
  org: string;
  organizationId: string;
  hasUserVoted: boolean;
  isAuthenticated?: boolean;
  isExternal?: boolean;
};

export function RoadmapCard({
  post,
  org,
  organizationId,
  hasUserVoted,
  isAuthenticated,
  isExternal = false,
}: RoadmapCardProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [, startTransition] = useTransition();

  const [voteCount, setVoteCount] = useState(post.voteCount);
  const [userHasVoted, setUserHasVoted] = useState(hasUserVoted);

  // Vote mutation
  const voteMutation = useMutation(
    trpc.feedback.vote.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.feedback.getAll.queryKey({ organizationId }),
        });
      },
      onError: () => {
        setVoteCount(post.voteCount);
        setUserHasVoted(hasUserVoted);
        toast.error("Failed to vote");
      },
    })
  );

  const handleVote = () => {
    if (!isAuthenticated) {
      toast.error("You must be logged in to vote");
      return;
    }

    startTransition(() => {
      if (userHasVoted) {
        setVoteCount(voteCount - 1);
        setUserHasVoted(false);
      } else {
        setVoteCount(voteCount + 1);
        setUserHasVoted(true);
      }

      voteMutation.mutate({
        postId: post.id,
        value: userHasVoted ? 0 : 1,
      });
    });
  };

  const href = isExternal
    ? `/${org}/feedback/${post.id}`
    : `/org/${org}/feedback/${post.id}`;

  return (
    <div
      className={cn(
        "group flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm transition-all",
        "hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
      )}
    >
      <Link
        className="font-medium text-sm leading-normal transition-colors hover:text-primary"
        href={href}
      >
        {post.title}
      </Link>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1.5 rounded-full bg-secondary px-2 py-0.5 font-medium text-secondary-foreground">
            {categoryLabels[post.category]}
          </span>
          <span>
            {new Date(post.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric",
            })}
          </span>
        </div>

        <VoteButton
          className="h-6 w-auto gap-1 px-2 py-0 text-[10px]"
          hasVoted={userHasVoted}
          onVote={handleVote}
          voteCount={voteCount}
        />
      </div>
    </div>
  );
}
