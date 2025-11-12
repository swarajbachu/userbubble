"use client";

import { trpc } from "~/trpc/react";
import { RoadmapColumn } from "./roadmap-column";

interface RoadmapBoardProps {
  org: string;
}

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
        title="Planned"
        description="Features we're planning to build"
        posts={plannedPosts ?? []}
        org={org}
        colorClass="border-purple-200 dark:border-purple-800"
      />

      <RoadmapColumn
        title="In Progress"
        description="Currently being worked on"
        posts={inProgressPosts ?? []}
        org={org}
        colorClass="border-yellow-200 dark:border-yellow-800"
      />

      <RoadmapColumn
        title="Completed"
        description="Recently shipped features"
        posts={completedPosts ?? []}
        org={org}
        colorClass="border-green-200 dark:border-green-800"
      />
    </div>
  );
}
