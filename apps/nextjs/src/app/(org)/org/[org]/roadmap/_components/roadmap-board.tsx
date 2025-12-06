"use client";

import {
  CheckmarkBadge01Icon,
  Clock01Icon,
  HourglassIcon,
} from "@hugeicons-pro/core-bulk-rounded";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useTRPC } from "~/trpc/react";
import { RoadmapColumn } from "./roadmap-column";

type RoadmapBoardProps = {
  org: string;
  organizationId: string;
};

export function RoadmapBoard({ org, organizationId }: RoadmapBoardProps) {
  const trpc = useTRPC();

  const { data: allPosts } = useSuspenseQuery(
    trpc.feedback.getAll.queryOptions({
      organizationId,
      sortBy: "votes",
    })
  );

  const plannedPosts =
    allPosts?.filter((post) => post.post.status === "planned") ?? [];
  const inProgressPosts =
    allPosts?.filter((post) => post.post.status === "in_progress") ?? [];
  const completedPosts =
    allPosts?.filter((post) => post.post.status === "completed") ?? [];

  return (
    <div className="grid gap-6 md:grid-cols-3">
      <RoadmapColumn
        color="text-purple-500"
        description="Features we're planning to build"
        icon={Clock01Icon}
        org={org}
        posts={plannedPosts}
        title="Planned"
      />

      <RoadmapColumn
        color="text-orange-500"
        description="Currently being worked on"
        icon={HourglassIcon}
        org={org}
        posts={inProgressPosts}
        title="In Progress"
      />

      <RoadmapColumn
        color="text-green-500"
        description="Recently shipped features"
        icon={CheckmarkBadge01Icon}
        org={org}
        posts={completedPosts}
        title="Completed"
      />
    </div>
  );
}
