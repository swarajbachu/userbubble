"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkBadge01Icon } from "@hugeicons-pro/core-bulk-rounded";
import {
  ArrowDown01Icon,
  FilterHorizontalIcon,
  Search01Icon,
} from "@hugeicons-pro/core-duotone-rounded";
import { useQuery } from "@tanstack/react-query";
import type { FeedbackCategory, FeedbackStatus } from "@userbubble/db/schema";
import { cn } from "@userbubble/ui";
import { Button } from "@userbubble/ui/button";
import { Dialog, DialogPopup, DialogTitle } from "@userbubble/ui/dialog";
import { Icon } from "@userbubble/ui/icon";
import { Input } from "@userbubble/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@userbubble/ui/popover";
import Link from "next/link";
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";
import { type ReactNode, useState } from "react";
import { getStatus, statuses } from "~/components/feedback/config";
import { useTRPC } from "~/trpc/react";

type FeedbackFiltersProps = {
  organizationId: string;
};

export function FeedbackFilters({ organizationId }: FeedbackFiltersProps) {
  const trpc = useTRPC();
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [sort, setSort] = useQueryState(
    "sort",
    parseAsString.withDefault("recent")
  );

  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsArrayOf(parseAsString).withDefault([])
  );
  const [category] = useQueryState("category", parseAsString);

  const isStatusActive = (value: string) => statusFilter.includes(value);

  const toggleStatus = (value: string) => {
    if (statusFilter.includes(value)) {
      const newStatus = statusFilter.filter((s) => s !== value);
      setStatusFilter(newStatus.length > 0 ? newStatus : null);
    } else {
      setStatusFilter([...statusFilter, value]);
    }
  };

  const sortLabel = sort === "recent" ? "Newest" : "Top Voted";
  const searchValue = search.trim().toLowerCase();

  const { data: posts = [] } = useQuery(
    trpc.feedback.getAll.queryOptions({
      organizationId,
      status:
        statusFilter.length > 0
          ? (statusFilter as FeedbackStatus[])
          : undefined,
      category: (category as FeedbackCategory | null) ?? undefined,
      sortBy: (sort as "votes" | "recent") ?? "recent",
    })
  );

  const searchResults = searchValue
    ? posts.filter((item) => {
        const title = item.post.title.toLowerCase();
        const description = (item.post.description ?? "").toLowerCase();
        return title.includes(searchValue) || description.includes(searchValue);
      })
    : [];

  let mobileSearchContent: ReactNode;
  if (searchValue) {
    if (searchResults.length > 0) {
      mobileSearchContent = (
        <div className="space-y-1">
          {searchResults.map((item) => {
            const config = getStatus(item.post.status);
            return (
              <Link
                className="block rounded-lg p-2 transition-colors hover:bg-accent/50"
                href={`/feedback/${item.post.id}`}
                key={item.post.id}
                onClick={() => setMobileSearchOpen(false)}
              >
                <div className="flex items-start gap-2">
                  {config && (
                    <Icon
                      className={cn("mt-1 size-4 shrink-0", config.color)}
                      icon={config.icon}
                    />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 font-medium text-base">
                      {item.post.title}
                    </p>
                    <p className="line-clamp-1 text-muted-foreground text-sm">
                      {item.post.description}
                    </p>
                  </div>
                  <span className="shrink-0 text-muted-foreground text-sm">
                    {item.post.voteCount}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      );
    } else {
      mobileSearchContent = (
        <p className="text-muted-foreground text-sm">
          No results for "{search}".
        </p>
      );
    }
  } else {
    mobileSearchContent = (
      <p className="text-muted-foreground text-sm">
        Start typing to search feedback posts.
      </p>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative hidden md:block">
        <HugeiconsIcon
          className="-translate-y-1/2 absolute top-1/2 left-2.5 text-muted-foreground/50"
          icon={Search01Icon}
          size={16}
        />
        <Input
          className="h-9 w-[240px] border-none bg-secondary/50 pl-9 transition-all focus:bg-background focus:ring-1"
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search feedback..."
          value={search}
        />
      </div>

      <div className="hidden h-4 w-px bg-border/50 md:block" />

      <Popover>
        <PopoverTrigger
          render={(props) => (
            <Button
              {...props}
              className={cn(
                "relative h-9 w-9 gap-2 p-0 font-normal text-muted-foreground hover:text-foreground md:w-auto md:px-3",
                statusFilter.length > 0 && "bg-secondary/50 text-foreground"
              )}
              size="sm"
              variant="ghost"
            >
              <HugeiconsIcon icon={FilterHorizontalIcon} size={16} />
              <span className="hidden md:inline">Filter</span>
              {statusFilter.length > 0 && (
                <span className="-right-1 -top-1 absolute flex h-4 w-4 items-center justify-center rounded-full bg-primary font-medium text-[10px] text-primary-foreground md:static md:h-5 md:min-w-5 md:px-1">
                  {statusFilter.length}
                </span>
              )}
            </Button>
          )}
        />
        <PopoverContent align="end" className="w-56 p-1">
          <div className="px-2 py-1.5 font-medium text-muted-foreground text-xs">
            Filter by status
          </div>
          {statuses.map((filter) => (
            <button
              className={cn(
                "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent",
                isStatusActive(filter.value) && "bg-accent/50"
              )}
              key={filter.value}
              onClick={() => toggleStatus(filter.value)}
              type="button"
            >
              <div className="flex items-center gap-2">
                <Icon
                  className={cn("size-3.5", filter.color)}
                  icon={filter.icon}
                />
                <span className="text-sm">{filter.label}</span>
              </div>
              {isStatusActive(filter.value) && (
                <HugeiconsIcon
                  className="text-primary"
                  icon={CheckmarkBadge01Icon}
                  size={14}
                />
              )}
            </button>
          ))}
          {statusFilter.length > 0 && (
            <>
              <div className="my-1 h-px bg-border/50" />
              <button
                className="w-full rounded-sm px-2 py-1.5 text-left text-muted-foreground text-xs hover:bg-accent hover:text-foreground"
                onClick={() => setStatusFilter(null)}
                type="button"
              >
                Clear filters
              </button>
            </>
          )}
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger
          render={(props) => (
            <Button
              {...props}
              className="h-9 gap-2 px-3 font-normal text-muted-foreground hover:text-foreground"
              size="sm"
              variant="ghost"
            >
              <HugeiconsIcon icon={ArrowDown01Icon} size={16} />
              <span>{sortLabel}</span>
            </Button>
          )}
        />
        <PopoverContent align="end" className="w-40 p-1">
          <Button
            className={cn(
              "h-8 w-full justify-start px-2 font-normal",
              sort === "recent" && "bg-accent text-accent-foreground"
            )}
            onClick={() => setSort("recent")}
            size="sm"
            variant="ghost"
          >
            Newest
          </Button>
          <Button
            className={cn(
              "h-8 w-full justify-start px-2 font-normal",
              sort === "votes" && "bg-accent text-accent-foreground"
            )}
            onClick={() => setSort("votes")}
            size="sm"
            variant="ghost"
          >
            Top Voted
          </Button>
        </PopoverContent>
      </Popover>

      <Button
        className="h-9 w-9 md:hidden"
        onClick={() => setMobileSearchOpen(true)}
        size="icon"
        variant="ghost"
      >
        <HugeiconsIcon icon={Search01Icon} size={18} />
      </Button>

      <Dialog onOpenChange={setMobileSearchOpen} open={mobileSearchOpen}>
        <DialogPopup className="h-dvh max-w-none rounded-none border-none p-0 md:hidden">
          <DialogTitle className="sr-only">Search Feedback</DialogTitle>
          <div className="flex h-full flex-col bg-background">
            <div className="flex items-center gap-2 border-b p-2">
              <div className="relative flex-1">
                <HugeiconsIcon
                  className="-translate-y-1/2 absolute top-1/2 left-3 text-muted-foreground"
                  icon={Search01Icon}
                  size={18}
                />
                <input
                  autoFocus
                  className="h-10 w-full rounded-md bg-secondary/50 pr-4 pl-9 text-sm outline-none placeholder:text-muted-foreground"
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search feedback..."
                  value={search}
                />
              </div>
              <Button
                onClick={() => setMobileSearchOpen(false)}
                size="sm"
                variant="ghost"
              >
                Cancel
              </Button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-4">
              {mobileSearchContent}
            </div>
          </div>
        </DialogPopup>
      </Dialog>
    </div>
  );
}
