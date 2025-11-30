"use client";

import type { FeedbackStatus } from "@critichut/db/schema";
import { Icon } from "@critichut/ui/icon";
import { Message01Icon } from "@hugeicons-pro/core-duotone-rounded";
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

  const { data: posts } = useSuspenseQuery(
    trpc.feedback.getAll.queryOptions({
      organizationId: activeOrganization?.id ?? "",
      status: filters?.status as FeedbackStatus | undefined,
      sortBy: (filters?.sort as "votes" | "recent") ?? "recent",
    })
  );

  if (!activeOrganization) {
    return null;
  }

  if (posts.length === 0) {
    return (
      <div className="fade-in-50 flex min-h-[400px] animate-in flex-col items-center justify-center rounded-xl border border-dashed p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Icon className="text-primary" icon={Message01Icon} size={24} />
        </div>
        <h3 className="mt-4 font-semibold text-lg">
          Ready to collect feedback!
        </h3>
        <p className="mt-2 max-w-sm text-muted-foreground text-sm">
          Your feedback board is live. Share it with users to start collecting
          ideas.
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
