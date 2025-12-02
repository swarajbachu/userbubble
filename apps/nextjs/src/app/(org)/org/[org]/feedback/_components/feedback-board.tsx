"use client";

import type { FeedbackStatus } from "@critichut/db/schema";
import { DoubleCard, DoubleCardInner } from "@critichut/ui/double-card";
import { Icon } from "@critichut/ui/icon";
import { Message01Icon } from "@hugeicons-pro/core-duotone-rounded";
import { useSuspenseQuery } from "@tanstack/react-query";
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";
import { authClient } from "~/auth/client";
import { useTRPC } from "~/trpc/react";
import { PostCard } from "./post-card";

type FeedbackBoardProps = {
  org: string;
};

export function FeedbackBoard({ org }: FeedbackBoardProps) {
  const trpc = useTRPC();

  const { data: activeOrganization } = authClient.useActiveOrganization();

  const [status] = useQueryState(
    "status",
    parseAsArrayOf(parseAsString).withDefault([])
  );

  const [sort] = useQueryState("sort", parseAsString.withDefault("recent"));

  const { data: posts } = useSuspenseQuery(
    trpc.feedback.getAll.queryOptions({
      organizationId: activeOrganization?.id ?? "",
      status: status.length > 0 ? (status as FeedbackStatus[]) : undefined,
      sortBy: (sort as "votes" | "recent") ?? "recent",
    })
  );

  if (!activeOrganization) {
    return null;
  }

  if (posts.length === 0) {
    return (
      <DoubleCard>
        <DoubleCardInner className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
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
        </DoubleCardInner>
      </DoubleCard>
    );
  }

  return (
    <div className="flex flex-col p-2">
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
