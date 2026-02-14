"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@userbubble/ui";
import { Button } from "@userbubble/ui/button";
import { useState } from "react";
import { categoryLabels, statusConfig } from "~/components/feedback/config";
import { VoteButton } from "~/components/feedback/vote-button";
import { useTRPC } from "~/trpc/react";
import { EmbedFeedbackDetail } from "./embed-feedback-detail";
import { EmbedFeedbackForm } from "./embed-feedback-form";

type EmbedFeedbackListProps = {
  organizationId: string;
};

export function EmbedFeedbackList({ organizationId }: EmbedFeedbackListProps) {
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"recent" | "votes">("recent");
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: posts, isLoading } = useQuery(
    trpc.feedback.getAll.queryOptions({
      organizationId,
      sortBy,
    })
  );

  const voteMutation = useMutation(
    trpc.feedback.vote.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.feedback.pathFilter());
      },
    })
  );

  if (selectedPostId) {
    return (
      <EmbedFeedbackDetail
        onBack={() => setSelectedPostId(null)}
        postId={selectedPostId}
      />
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {/* Inline form */}
      <EmbedFeedbackForm organizationId={organizationId} />

      {/* Sort toggle */}
      <div className="flex items-center gap-1">
        <Button
          className="h-7 px-2.5 text-xs"
          onClick={() => setSortBy("recent")}
          size="sm"
          variant={sortBy === "recent" ? "secondary" : "ghost"}
        >
          Newest
        </Button>
        <Button
          className="h-7 px-2.5 text-xs"
          onClick={() => setSortBy("votes")}
          size="sm"
          variant={sortBy === "votes" ? "secondary" : "ghost"}
        >
          Top Voted
        </Button>
      </div>

      {/* Posts list */}
      <FeedbackPostsList
        isLoading={isLoading}
        onSelectPost={setSelectedPostId}
        onVote={(postId, value) => voteMutation.mutate({ postId, value })}
        posts={posts}
      />
    </div>
  );
}

type FeedbackPostsListProps = {
  posts:
    | Array<{
        post: {
          id: string;
          title: string;
          status: keyof typeof statusConfig;
          category: keyof typeof categoryLabels;
          voteCount: number;
        };
        hasUserVoted: boolean;
      }>
    | undefined;
  isLoading: boolean;
  onSelectPost: (id: string) => void;
  onVote: (postId: string, value: number) => void;
};

function FeedbackPostsList({
  posts,
  isLoading,
  onSelectPost,
  onVote,
}: FeedbackPostsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div className="h-14 animate-pulse rounded-lg bg-muted" key={i} />
        ))}
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground text-sm">No feedback yet</p>
        <p className="mt-1 text-muted-foreground/60 text-xs">
          Be the first to share your thoughts!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {posts.map((item) => {
        const config = statusConfig[item.post.status];
        return (
          <button
            className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-secondary/50"
            key={item.post.id}
            onClick={() => onSelectPost(item.post.id)}
            type="button"
          >
            <span
              className="shrink-0"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.stopPropagation();
                }
              }}
            >
              <VoteButton
                className="h-7 w-auto gap-1 px-2 py-0 text-[10px]"
                hasVoted={item.hasUserVoted}
                onVote={() => onVote(item.post.id, item.hasUserVoted ? 0 : 1)}
                voteCount={item.post.voteCount}
              />
            </span>
            <span className="min-w-0 flex-1">
              <span className="line-clamp-1 block font-medium text-sm">
                {item.post.title}
              </span>
              <span className="mt-0.5 flex items-center gap-1.5">
                <span
                  className={cn(
                    "h-1.5 w-1.5 rounded-full",
                    config.color.replace("text-", "bg-")
                  )}
                />
                <span className="text-[11px] text-muted-foreground">
                  {categoryLabels[item.post.category]}
                </span>
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
