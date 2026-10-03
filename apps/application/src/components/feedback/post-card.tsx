/** biome-ignore-all lint/nursery/noShadow: memo function pattern */
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { RouterOutputs } from "@userbubble/api";

type FeedbackPost = RouterOutputs["feedback"]["create"];

import { cn } from "@userbubble/ui";
import { Icon } from "@userbubble/ui/icon";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { memo, useState, useTransition } from "react";
import { useTRPC } from "~/trpc/react";
import { getStatus } from "./config";
import { VoteButton } from "./vote-button";

type PostCardProps = {
  post: FeedbackPost;
  author: { name: string | null; image: string | null };
  org: string;
  hasUserVoted: boolean;
  isExternal?: boolean;
};

export const PostCard = memo(function PostCard({
  post,
  org,
  hasUserVoted,
  isExternal = false,
}: PostCardProps) {
  const trpc = useTRPC();
  const pathname = usePathname();
  const prefix = pathname.startsWith("/external/") ? `/external/${org}` : "";
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

  const config = getStatus(post.status);

  return (
    <div className="group flex items-center gap-4 rounded-lg px-3 py-3 transition-colors hover:bg-muted/50">
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
          href={
            isExternal
              ? `${prefix}/feedback/${post.id}`
              : `/org/${org}/feedback/${post.id}`
          }
        >
          <span className="truncate font-medium text-sm transition-colors group-hover:text-primary">
            {post.title}
          </span>
        </Link>
      </div>

      <div className="flex flex-none items-center gap-3 text-muted-foreground text-xs">
        {config && (
          <Icon
            className={cn("size-4", config.color)}
            icon={config.icon}
            {...("strokeWidth" in config && {
              strokeWidth: config.strokeWidth,
            })}
          />
        )}

        <span className="hidden sm:inline">
          {new Date(post.createdAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </span>
      </div>
    </div>
  );
});
