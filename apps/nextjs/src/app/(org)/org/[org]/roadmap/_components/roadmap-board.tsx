"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { authClient } from "~/auth/client";
import { useTRPC } from "~/trpc/react";
import { RoadmapColumn } from "./roadmap-column";

type RoadmapBoardProps = {
  org: string;
};

export function RoadmapBoard({ org }: RoadmapBoardProps) {
  const trpc = useTRPC();

  const { data: activeOrganization } = authClient.useActiveOrganization();

  const { data: plannedPosts } = useSuspenseQuery(
    trpc.feedback.getAll.queryOptions({
      organizationId: activeOrganization?.id ?? "",
      sortBy: "votes",
    })
  );

  if (!activeOrganization) {
    return null;
  }

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <RoadmapColumn
        colorClass="border-purple-200 dark:border-purple-800"
        description="Features we're planning to build"
        org={org}
        posts={plannedPosts ?? []}
        title="Planned"
      />

      <RoadmapColumn
        colorClass="border-yellow-200 dark:border-yellow-800"
        description="Currently being worked on"
        org={org}
        posts={[]}
        title="In Progress"
      />

      <RoadmapColumn
        colorClass="border-green-200 dark:border-green-800"
        description="Recently shipped features"
        org={org}
        posts={[]}
        title="Completed"
      />
    </div>
  );
}
