"use client";

import { Button } from "@critichut/ui/button";
import { ChevronUp } from "lucide-react";
import { useState } from "react";
import { trpc } from "~/trpc/react";

type VoteButtonProps = {
  postId: string;
  initialVotes: number;
};

export function VoteButton({ postId, initialVotes }: VoteButtonProps) {
  const [optimisticVotes, setOptimisticVotes] = useState(initialVotes);
  const utils = trpc.useUtils();

  const { data: userVote } = trpc.feedback.getUserVote.useQuery(
    { postId },
    {
      retry: false,
    }
  );

  const voteMutation = trpc.feedback.vote.useMutation({
    onMutate: async (variables) => {
      // Optimistically update the vote count
      if (variables.value === 1 && !userVote) {
        setOptimisticVotes((prev) => prev + 1);
      } else if (variables.value === 0 && userVote) {
        setOptimisticVotes((prev) => prev - 1);
      }
    },
    onSuccess: () => {
      // Invalidate queries to refetch
      void utils.feedback.getUserVote.invalidate({ postId });
      void utils.feedback.getAll.invalidate();
    },
    onError: () => {
      // Revert optimistic update on error
      setOptimisticVotes(initialVotes);
    },
  });

  const handleVote = () => {
    if (userVote) {
      // Remove vote
      voteMutation.mutate({ postId, value: 0 });
    } else {
      // Add vote
      voteMutation.mutate({ postId, value: 1 });
    }
  };

  const hasVoted = !!userVote;

  return (
    <Button
      className="flex h-auto flex-col gap-1 px-3 py-2"
      disabled={voteMutation.isPending}
      onClick={handleVote}
      size="sm"
      variant={hasVoted ? "default" : "outline"}
    >
      <ChevronUp className={`h-4 w-4 ${hasVoted ? "fill-current" : ""}`} />
      <span className="font-semibold text-sm">{optimisticVotes}</span>
    </Button>
  );
}
