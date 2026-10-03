"use client";

import { useSuspenseQuery } from "@tanstack/react-query";
import type { FeedbackStatus } from "@userbubble/db/schema";

import { Input } from "@userbubble/ui/input";
import { Label } from "@userbubble/ui/label";
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";
import { useSyncExternalStore } from "react";
import { PostCard } from "~/components/feedback/post-card";
import { useTRPC } from "~/trpc/react";

import { CreateRequestButton } from "./create-request-button";

type FeedbackBoardProps = {
  org: string;
  organizationId: string;
};

const subscribe = () => () => {
  // Hydration has no external events to unsubscribe from.
};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export function FeedbackBoard({ org, organizationId }: FeedbackBoardProps) {
  const trpc = useTRPC();
  const hydrated = useSyncExternalStore(
    subscribe,
    clientSnapshot,
    serverSnapshot
  );

  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [status] = useQueryState(
    "status",
    parseAsArrayOf(parseAsString).withDefault([])
  );

  const [sort, setSort] = useQueryState(
    "sort",
    parseAsString.withDefault("recent")
  );

  const { data: posts } = useSuspenseQuery(
    trpc.feedback.getAll.queryOptions({
      organizationId,
      status: status.length > 0 ? (status as FeedbackStatus[]) : undefined,
      sortBy: (sort as "votes" | "recent") ?? "recent",
    })
  );

  const visible = posts.filter(({ post }) =>
    `${post.title} ${post.description}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 pb-5">
        <h1 className="mr-auto font-semibold text-lg">Requests</h1>
        <Input
          aria-label="Search requests"
          className="w-full border-0 bg-muted/60 shadow-none sm:w-56"
          disabled={!hydrated}
          onChange={(event) => setSearch(event.target.value || null)}
          placeholder="Search requests…"
          value={search}
        />
        <span className="sr-only">
          {visible.length} {visible.length === 1 ? "request" : "requests"}
        </span>
        <Label className="sr-only" htmlFor="request-sort">
          Sort requests
        </Label>
        <select
          className="h-8 rounded-lg border-0 bg-muted/60 px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
          disabled={!hydrated}
          id="request-sort"
          onChange={(event) => setSort(event.target.value)}
          value={sort}
        >
          <option value="recent">Newest first</option>
          <option value="votes">Most votes</option>
        </select>
        <CreateRequestButton />
      </div>
      <div className="flex flex-col">
        {visible.map((item) => (
          <PostCard
            // biome-ignore lint/style/noNonNullAssertion: expected
            author={item.author!}
            hasUserVoted={item.hasUserVoted}
            key={item.post.id}
            org={org}
            post={item.post}
          />
        ))}
        {visible.length === 0 && (
          <p className="squircle rounded-xl bg-muted/40 p-8 text-center text-muted-foreground text-sm">
            {posts.length === 0
              ? "Your feedback starts here. Share your board to collect ideas."
              : "No requests match your search."}
          </p>
        )}
      </div>
    </div>
  );
}
