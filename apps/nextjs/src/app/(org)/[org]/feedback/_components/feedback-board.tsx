"use client";

import { trpc } from "~/trpc/react";
import { PostCard } from "./post-card";

type FeedbackBoardProps = {
  org: string;
  filters?: {
    status?: string;
    sort?: string;
  };
};

export function FeedbackBoard({ org, filters }: FeedbackBoardProps) {
  const { data: orgData } = trpc.organization.getBySlug.useQuery({
    slug: org,
  });

  const { data: posts, isLoading } = trpc.feedback.getAll.useQuery(
    {
      organizationId: orgData?.id ?? "",
      status: filters?.status,
      sortBy: (filters?.sort as "votes" | "recent") ?? "recent",
    },
    {
      enabled: !!orgData?.id,
    }
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div className="h-32 animate-pulse rounded-lg bg-muted" key={i} />
        ))}
      </div>
    );
  }

  if (!posts || posts.length === 0) {
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
