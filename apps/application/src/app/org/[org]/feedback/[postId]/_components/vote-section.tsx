"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";
import { VoteButton } from "../../_components/vote-button";

type VoteSectionProps = {
  postId: string;
  initialVoteCount: number;
  hasUserVoted: boolean;
  isAuthenticated: boolean;
};

export function VoteSection({
  postId,
  initialVoteCount,
  hasUserVoted,
  isAuthenticated,
}: VoteSectionProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [, startTransition] = useTransition();

  const [voteCount, setVoteCount] = useState(initialVoteCount);
  const [userHasVoted, setUserHasVoted] = useState(hasUserVoted);

  const voteMutation = useMutation(
    trpc.feedback.vote.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.feedback.getById.queryKey({ id: postId }),
        });
      },
      onError: () => {
        // Rollback on error
        setVoteCount(initialVoteCount);
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
      // Optimistic update
      if (userHasVoted) {
        setVoteCount(voteCount - 1);
        setUserHasVoted(false);
      } else {
        setVoteCount(voteCount + 1);
        setUserHasVoted(true);
      }

      voteMutation.mutate({
        postId,
        value: userHasVoted ? 0 : 1,
      });
    });
  };

  return (
    <VoteButton
      className="h-8 w-12 flex-row gap-1 px-0 text-sm"
      hasVoted={userHasVoted}
      onVote={handleVote}
      voteCount={voteCount}
    />
  );
}
