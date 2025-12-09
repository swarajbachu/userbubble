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
  isAuthenticated?: boolean;
  isExternal?: boolean;
};

export function RoadmapBoard({
  org,
  organizationId,
  isAuthenticated,
  isExternal = false,
}: RoadmapBoardProps) {
  const trpc = useTRPC();

  // Fetch all posts
  const { data: allPosts } = useSuspenseQuery(
    trpc.feedback.getAll.queryOptions({
      organizationId,
      sortBy: "votes",
    })
  );

  // Filter by status
  const plannedPosts =
    allPosts?.filter((post) => post.post.status === "planned") ?? [];
  const inProgressPosts =
    allPosts?.filter((post) => post.post.status === "in_progress") ?? [];
  const completedPosts =
    allPosts?.filter((post) => post.post.status === "completed") ?? [];

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <RoadmapColumn
        description="Features we're planning to build"
        icon={Clock01Icon}
        isAuthenticated={isAuthenticated}
        isExternal={isExternal}
        org={org}
        organizationId={organizationId}
        posts={plannedPosts}
        status="planned"
        title="Planned"
      />

      <RoadmapColumn
        description="Currently being worked on"
        icon={HourglassIcon}
        isAuthenticated={isAuthenticated}
        isExternal={isExternal}
        org={org}
        organizationId={organizationId}
        posts={inProgressPosts}
        status="in_progress"
        title="In Progress"
      />

      <RoadmapColumn
        description="Recently completed features"
        icon={CheckmarkBadge01Icon}
        isAuthenticated={isAuthenticated}
        isExternal={isExternal}
        org={org}
        organizationId={organizationId}
        posts={completedPosts}
        status="completed"
        title="Completed"
      />
    </div>
  );
}
