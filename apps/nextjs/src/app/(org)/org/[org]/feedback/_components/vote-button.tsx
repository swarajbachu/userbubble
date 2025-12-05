"use client";

import type { FeedbackVote } from "@critichut/db/schema";
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
  userVote: FeedbackVote | null; // NEW: passed from parent, no longer queries
  className?: string;
};

export function VoteButton({
  postId,
  initialVotes,
  userVote,
  className,
}: VoteButtonProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();

  // React 19 useOptimistic - automatic rollback on error
  // IMPORTANT: The base state (first arg) must be reactive to prop changes
  const [optimisticVotes, addOptimisticVote] = useOptimistic(
    initialVotes,
    (currentVotes: number, increment: number) => currentVotes + increment
  );

  const [optimisticHasVoted, setOptimisticHasVoted] = useOptimistic(
    !!userVote,
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

    const isVoted = !!userVote;

    // Wrap in startTransition for instant UI update
    startTransition(() => {
      // Step 1: Update UI IMMEDIATELY (optimistic)
      if (isVoted) {
        addOptimisticVote(-1); // Decrement vote count
        setOptimisticHasVoted(false); // Unvote
      } else {
        addOptimisticVote(1); // Increment vote count
        setOptimisticHasVoted(true); // Vote
      }

      // Step 2: THEN fire the mutation
      // If it fails, useOptimistic auto-reverts to initialVotes and !!userVote
      voteMutation.mutate({
        postId,
        value: isVoted ? 0 : 1,
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
