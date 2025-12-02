"use client";

import { cn } from "@critichut/ui";
import { Button } from "@critichut/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronUp } from "lucide-react";
import { useState } from "react";

import { useTRPC } from "~/trpc/react";

type VoteButtonProps = {
  postId: string;
  initialVotes: number;
  className?: string;
};

export function VoteButton({
  postId,
  initialVotes,
  className,
}: VoteButtonProps) {
  const [optimisticVotes, setOptimisticVotes] = useState(initialVotes);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: userVote } = useQuery(
    trpc.feedback.getUserVote.queryOptions({ postId })
  );

  const voteMutation = useMutation(
    trpc.feedback.vote.mutationOptions({
      onMutate: async (variables: { postId: string; value: number }) => {
        // Optimistically update the vote count
        if (variables.value === 1 && !userVote) {
          setOptimisticVotes((prev) => prev + 1);
        } else if (variables.value === 0 && userVote) {
          setOptimisticVotes((prev) => prev - 1);
        }
      },
      onSuccess: async () => {
        // Invalidate queries to refetch
        await queryClient.invalidateQueries(trpc.feedback.pathFilter());
      },
      onError: () => {
        // Revert optimistic update on error
        setOptimisticVotes(initialVotes);
      },
    })
  );

  const handleVote = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
      className={cn("flex h-auto items-center gap-1.5 px-3 py-1", className)}
      disabled={voteMutation.isPending}
      onClick={handleVote}
      size="sm"
      variant={hasVoted ? "default" : "secondary"}
    >
      <ChevronUp className={cn("h-4 w-4", hasVoted ? "fill-current" : "")} />
      <span className="font-medium text-xs">{optimisticVotes}</span>
    </Button>
  );
}
