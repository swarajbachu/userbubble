"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";
import { authClient } from "~/auth/client";
import { useTRPC } from "~/trpc/react";
import { ChangelogEmptyState } from "./changelog-empty-state";
import { ChangelogFilters } from "./changelog-filters";
import { ChangelogTimeline } from "./changelog-timeline";
import { CreateEntryButton } from "./create-entry-button";

type ChangelogBoardProps = {
  org: string;
  organizationId: string;
};

export function ChangelogBoard({ org, organizationId }: ChangelogBoardProps) {
  const trpc = useTRPC();

  // Get session to identify current user
  const { data: session } = authClient.useSession();

  // Get active organization to check admin status
  const { data: activeOrg } = authClient.useActiveOrganization();

  // Check if user is admin/owner
  const currentMember = activeOrg?.members.find(
    (m) => m.userId === session?.user?.id
  );
  const isAdmin = currentMember
    ? ["admin", "owner"].includes(currentMember.role)
    : false;

  // URL state for filters
  const [tags] = useQueryState(
    "tags",
    parseAsArrayOf(parseAsString).withDefault([])
  );
  const [dateFrom] = useQueryState("from", parseAsString);
  const [dateTo] = useQueryState("to", parseAsString);

  // Fetch changelog entries
  const { data: entries } = useSuspenseQuery(
    trpc.changelog.getAll.queryOptions({
      organizationId,
      ...(isAdmin ? {} : { published: true }),
      tags: tags.length > 0 ? tags : undefined,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    })
  );

  const hasActiveFilters = tags.length > 0 || !!dateFrom || !!dateTo;

  if (entries.length === 0) {
    return (
      <ChangelogEmptyState
        isAdmin={isAdmin}
        isFiltered={hasActiveFilters}
        org={org}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and create button */}
      <div className="flex items-center justify-between gap-4">
        <ChangelogFilters />
        {isAdmin && <CreateEntryButton org={org} />}
      </div>

      {/* Timeline */}
      <ChangelogTimeline
        entries={entries}
        isAdmin={isAdmin}
        org={org}
        organizationId={organizationId}
      />
    </div>
  );
}
