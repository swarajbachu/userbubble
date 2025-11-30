"use client";

import type { FeedbackStatus } from "@critichut/db/schema";
import { useSuspenseQuery } from "@tanstack/react-query";
import { authClient } from "~/auth/client";
import { useTRPC } from "~/trpc/react";
import { PostCard } from "./post-card";

type FeedbackBoardProps = {
  org: string;
  filters?: {
    status?: string;
    sort?: string;
  };
};

export function FeedbackBoard({ org, filters }: FeedbackBoardProps) {
  const trpc = useTRPC();

  const { data: activeOrganization } = authClient.useActiveOrganization();

  if (!activeOrganization) {
    return null;
  }

  // biome-ignore lint/correctness/useHookAtTopLevel: <explanation>
  const { data: posts } = useSuspenseQuery(
    trpc.feedback.getAll.queryOptions({
      organizationId: activeOrganization.id,
      status: filters?.status as FeedbackStatus | undefined,
      sortBy: (filters?.sort as "votes" | "recent") ?? "recent",
    })
  );

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16">
        <p className="mb-2 font-medium text-lg text-muted-foreground">
          No feedback yet
        </p>
        <p className="text-muted-foreground text-sm">
          Be the first to share your ideas!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {posts.map((item) => (
        <PostCard
          author={item.author}
          key={item.post.id}
          org={org}
          post={item.post}
        />
      ))}
    </div>
  );
}
