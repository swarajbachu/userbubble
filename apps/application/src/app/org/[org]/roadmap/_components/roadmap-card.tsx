"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { FavouriteIcon } from "@hugeicons-pro/core-bulk-rounded";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { FeedbackPost } from "@userbubble/db/schema";
import { cn } from "@userbubble/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@userbubble/ui/avatar";
import { Icon } from "@userbubble/ui/icon";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { getCategory } from "~/components/feedback/config";
import { useTRPC } from "~/trpc/react";

type RoadmapCardProps = {
  post: FeedbackPost;
  author: { name: string | null; image: string | null } | null;
  org: string;
  organizationId: string;
  hasUserVoted: boolean;
  isDragging?: boolean;
  isAuthenticated?: boolean;
};

export function RoadmapCard({
  post,
  org,
  organizationId,
  author,
  hasUserVoted,
  isDragging: isDraggingProp,
  isAuthenticated,
}: RoadmapCardProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [, startTransition] = useTransition();

  const [voteCount, setVoteCount] = useState(post.voteCount);
  const [userHasVoted, setUserHasVoted] = useState(hasUserVoted);

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: post.id,
      data: { post, currentStatus: post.status },
    });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

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

  const categoryConfig = getCategory(post.category);

  return (
    <div
      className={cn(
        "group flex flex-col gap-2.5 rounded-lg border bg-card p-3 transition-all",
        "cursor-grab active:cursor-grabbing",
        "hover:border-border/80 hover:shadow-sm",
        (isDragging || isDraggingProp) && "cursor-grabbing opacity-50"
      )}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      <Link
        className="font-medium text-sm leading-snug transition-colors hover:text-primary"
        href={`/org/${org}/feedback/${post.id}`}
        onClick={(e) => e.stopPropagation()}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {post.title}
      </Link>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Avatar className="size-5">
            <AvatarImage src={author?.image ?? undefined} />
            <AvatarFallback className="text-[9px]">
              {author?.name?.[0]?.toUpperCase() ?? "A"}
            </AvatarFallback>
          </Avatar>
          {categoryConfig && (
            <span
              className={cn(
                "inline-flex items-center rounded-md px-1.5 py-0.5 font-medium text-[10px]",
                categoryConfig.color
                  .replace("text-", "bg-")
                  .replace("-500", "-500/15"),
                categoryConfig.color
              )}
            >
              {categoryConfig.label}
            </span>
          )}
        </div>

        <button
          className={cn(
            "flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] transition-colors",
            userHasVoted
              ? "bg-primary/10 font-semibold text-primary"
              : "text-muted-foreground hover:bg-muted"
          )}
          onClick={handleVote}
          onPointerDown={(e) => e.stopPropagation()}
          type="button"
        >
          <Icon icon={FavouriteIcon} size={12} />
          {voteCount}
        </button>
      </div>
    </div>
  );
}
