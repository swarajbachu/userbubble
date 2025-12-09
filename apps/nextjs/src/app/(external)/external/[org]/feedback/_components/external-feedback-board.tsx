"use client";

import type { OrganizationSettings } from "@critichut/db/schema";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";

type ExternalFeedbackBoardProps = {
  organizationId: string;
  settings: OrganizationSettings;
};

export function ExternalFeedbackBoard({
  organizationId,
}: ExternalFeedbackBoardProps) {
  const api = useTRPC();
  const { data: posts, isLoading } = useQuery(
    api.feedback.getAll.queryOptions({
      organizationId,
    })
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div className="h-24 animate-pulse rounded-lg bg-muted" key={i} />
        ))}
      </div>
    );
  }

  if (!posts || posts.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-muted-foreground">
          No feedback posts yet. Be the first to share your ideas!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <div
          className="rounded-lg border bg-card p-4 transition-colors hover:bg-accent/50"
          key={post.post.id}
        >
          <div className="flex items-start gap-4">
            <div className="flex min-w-[48px] flex-col items-center gap-1">
              <button
                className="flex flex-col items-center rounded p-2 transition-colors hover:bg-muted"
                type="button"
              >
                <span className="text-2xl">↑</span>
                <span className="font-medium text-sm">
                  {post.post.voteCount}
                </span>
              </button>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="mb-1 font-semibold text-lg">{post.post.title}</h3>
              <p className="line-clamp-2 text-muted-foreground text-sm">
                {post.post.description}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 font-medium text-primary text-xs">
                  {post.post.category}
                </span>
                <span className="inline-flex items-center rounded-full bg-muted px-2 py-1 font-medium text-xs">
                  {post.post.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
