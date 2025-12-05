"use client";

import { cn } from "@critichut/ui";
import { Button } from "@critichut/ui/button";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUp01Icon } from "@hugeicons-pro/core-duotone-rounded";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useOptimistic, useTransition } from "react";

import { useTRPC } from "~/trpc/react";

type VoteButtonProps = {
  postId: string;
  initialVotes: number;
  hasUserVoted: boolean;
  className?: string;
};

export function VoteButton({
  postId,
  initialVotes,
  hasUserVoted,
  className,
}: VoteButtonProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();

  // React 19 useOptimistic - automatic rollback on error
  const [optimisticVotes, addOptimisticVote] = useOptimistic(
    initialVotes,
    (currentVotes: number, increment: number) => currentVotes + increment
  );

  const [optimisticHasVoted, setOptimisticHasVoted] = useOptimistic(
    hasUserVoted,
    (_current: boolean, newValue: boolean) => newValue
  );

  const voteMutation = useMutation(
    trpc.feedback.vote.mutationOptions({
      onSuccess: async () => {
        // Only invalidate getAll queries (includes user votes now)
        await queryClient.invalidateQueries({
          queryKey: [["feedback", "getAll"]],
          exact: false,
        });
      },
    })
  );

  const handleVote = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Wrap in startTransition for instant UI update
    startTransition(() => {
      // Step 1: Update UI IMMEDIATELY (optimistic)
      if (hasUserVoted) {
        addOptimisticVote(-1); // Decrement vote count
        setOptimisticHasVoted(false); // Unvote
      } else {
        addOptimisticVote(1); // Increment vote count
        setOptimisticHasVoted(true); // Vote
      }

      // Step 2: THEN fire the mutation
      // If it fails, useOptimistic auto-reverts to initialVotes and hasUserVoted
      voteMutation.mutate({
        postId,
        value: hasUserVoted ? 0 : 1,
      });
    });
  };

  return (
    <Button
      className={cn("flex h-auto items-center gap-1.5 px-3 py-1", className)}
      disabled={isPending || voteMutation.isPending}
      onClick={handleVote}
      size="sm"
      variant={optimisticHasVoted ? "default" : "secondary"}
    >
      <HugeiconsIcon
        className={cn(optimisticHasVoted && "fill-current")}
        icon={ArrowUp01Icon}
        size={16}
        strokeWidth={2}
      />
      <span className="font-medium text-xs">{optimisticVotes}</span>
    </Button>
  );
}
