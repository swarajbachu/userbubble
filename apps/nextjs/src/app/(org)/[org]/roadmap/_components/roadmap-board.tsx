"use client";

import { trpc } from "~/trpc/react";
import { RoadmapColumn } from "./roadmap-column";

type RoadmapBoardProps = {
  org: string;
};

export function RoadmapBoard({ org }: RoadmapBoardProps) {
  const { data: orgData } = trpc.organization.getBySlug.useQuery({
    slug: org,
  });

  const { data: plannedPosts } = trpc.feedback.getAll.useQuery(
    {
      organizationId: orgData?.id ?? "",
      status: "planned",
      sortBy: "votes",
    },
    { enabled: !!orgData?.id }
  );

  const { data: inProgressPosts } = trpc.feedback.getAll.useQuery(
    {
      organizationId: orgData?.id ?? "",
      status: "in_progress",
      sortBy: "votes",
    },
    { enabled: !!orgData?.id }
  );

  const { data: completedPosts } = trpc.feedback.getAll.useQuery(
    {
      organizationId: orgData?.id ?? "",
      status: "completed",
      sortBy: "recent",
    },
    { enabled: !!orgData?.id }
  );

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
        posts={inProgressPosts ?? []}
        title="In Progress"
      />

      <RoadmapColumn
        colorClass="border-green-200 dark:border-green-800"
        description="Recently shipped features"
        org={org}
        posts={completedPosts ?? []}
        title="Completed"
      />
    </div>
  );
}
