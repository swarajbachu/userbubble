"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@userbubble/ui";
import { useState } from "react";
import { categoryLabels } from "~/components/feedback/config";
import { VoteButton } from "~/components/feedback/vote-button";
import { useTRPC } from "~/trpc/react";
import { EmbedFeedbackDetail } from "../../feedback/_components/embed-feedback-detail";

type EmbedRoadmapListProps = {
  organizationId: string;
};

const sections = [
  {
    status: "in_progress" as const,
    label: "In Progress",
    color: "bg-orange-500",
  },
  { status: "planned" as const, label: "Planned", color: "bg-purple-500" },
  { status: "completed" as const, label: "Completed", color: "bg-emerald-500" },
];

export function EmbedRoadmapList({ organizationId }: EmbedRoadmapListProps) {
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({
    completed: true,
  });
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const { data: allPosts, isLoading } = useQuery(
    trpc.feedback.getAll.queryOptions({
      organizationId,
      sortBy: "votes",
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

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i}>
            <div className="mb-2 h-5 w-24 animate-pulse rounded bg-muted" />
            <div className="h-20 animate-pulse rounded-lg bg-muted" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      {sections.map((section) => {
        const posts =
          allPosts?.filter((p) => p.post.status === section.status) ?? [];
        const isCollapsed = collapsed[section.status] ?? false;

        return (
          <div key={section.status}>
            <button
              className="flex w-full items-center gap-2 rounded-lg p-2 transition-colors hover:bg-secondary/50"
              onClick={() =>
                setCollapsed((prev) => ({
                  ...prev,
                  [section.status]: !isCollapsed,
                }))
              }
              type="button"
            >
              <span className={cn("h-2.5 w-2.5 rounded-full", section.color)} />
              <span className="font-semibold text-sm">{section.label}</span>
              <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-[11px] text-muted-foreground">
                {posts.length}
              </span>
              <svg
                className={cn(
                  "ml-auto h-4 w-4 text-muted-foreground transition-transform",
                  isCollapsed ? "-rotate-90" : ""
                )}
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>

            {!isCollapsed && (
              <div className="mt-1 space-y-1 pl-1">
                {posts.length === 0 ? (
                  <p className="py-4 text-center text-muted-foreground text-xs">
                    No items yet
                  </p>
                ) : (
                  posts.map((item) => (
                    <button
                      className="flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-colors hover:bg-secondary/50"
                      key={item.post.id}
                      onClick={() => setSelectedPostId(item.post.id)}
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
                          onVote={() =>
                            voteMutation.mutate({
                              postId: item.post.id,
                              value: item.hasUserVoted ? 0 : 1,
                            })
                          }
                          voteCount={item.post.voteCount}
                        />
                      </span>
                      <div className="min-w-0 flex-1">
                        <span className="line-clamp-1 font-medium text-sm">
                          {item.post.title}
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          {categoryLabels[item.post.category]}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
