"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  CheckmarkBadge01Icon,
  CircleIcon,
  Clock01Icon,
  EyeIcon,
  HourglassIcon,
} from "@hugeicons-pro/core-bulk-rounded";
import {
  ArrowDown01Icon,
  FilterHorizontalIcon,
  Search01Icon,
} from "@hugeicons-pro/core-duotone-rounded";
import { useQuery } from "@tanstack/react-query";
import type { FeedbackCategory, FeedbackStatus } from "@userbubble/db/schema";
import { cn } from "@userbubble/ui";
import { Button } from "@userbubble/ui/button";
import { Checkbox } from "@userbubble/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogPopup,
  DialogTitle,
} from "@userbubble/ui/dialog";
import { Icon } from "@userbubble/ui/icon";
import { Input } from "@userbubble/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@userbubble/ui/input-group";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@userbubble/ui/popover";
import Link from "next/link";
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";
import { type ReactNode, useState } from "react";
import { statusConfig } from "~/components/feedback/config";
import { useTRPC } from "~/trpc/react";

const STATUS_FILTERS = [
  { label: "Open", value: "open", color: "text-blue-500", icon: CircleIcon },
  {
    label: "Under Review",
    value: "under_review",
    color: "text-yellow-500",
    icon: EyeIcon,
  },
  {
    label: "Planned",
    value: "planned",
    color: "text-purple-500",
    icon: Clock01Icon,
  },
  {
    label: "In Progress",
    value: "in_progress",
    color: "text-orange-500",
    icon: HourglassIcon,
  },
  {
    label: "Completed",
    value: "completed",
    color: "text-green-500",
    icon: CheckmarkBadge01Icon,
  },
  {
    label: "Closed",
    value: "closed",
    color: "text-slate-500",
    icon: Cancel01Icon,
  },
] as const;

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
            const config = statusConfig[item.post.status];
            return (
              <Link
                className="block rounded-lg p-2 transition-colors hover:bg-accent/50"
                href={`/feedback/${item.post.id}`}
                key={item.post.id}
                onClick={() => setMobileSearchOpen(false)}
              >
                <div className="flex items-start gap-2">
                  <Icon
                    className={cn("mt-1 size-4 shrink-0", config.color)}
                    icon={config.icon}
                  />
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
      <Popover>
        <PopoverTrigger
          render={(props) => (
            <Button
              {...props}
              className="h-10 w-10 rounded-full p-0 md:h-9 md:w-auto md:gap-2 md:rounded-md md:px-3"
              size="sm"
              variant="outline"
            >
              <HugeiconsIcon icon={FilterHorizontalIcon} size={16} />
              <span className="hidden md:inline">Filter</span>
              {statusFilter.length > 0 && (
                <span className="rounded-full bg-primary px-1.5 py-0.5 font-medium text-primary-foreground text-xs">
                  {statusFilter.length}
                </span>
              )}
              <HugeiconsIcon
                className="ml-auto hidden opacity-50 md:inline"
                icon={ArrowDown01Icon}
                size={16}
              />
            </Button>
          )}
        />
        <PopoverContent align="start" className="w-56 p-2">
          <div className="space-y-1">
            <div className="px-2 py-1.5 font-medium text-muted-foreground text-sm">
              Status
            </div>
            {STATUS_FILTERS.map((filter) => (
              <button
                className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent"
                key={filter.value}
                onClick={() => toggleStatus(filter.value)}
                type="button"
              >
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={isStatusActive(filter.value)}
                    className="data-[state=checked]:bg-transparent data-[state=checked]:text-primary"
                  />
                  <span>{filter.label}</span>
                </div>
                <Icon
                  className={cn(
                    "size-4 transition-opacity",
                    isStatusActive(filter.value) ? "opacity-100" : "opacity-50",
                    filter.color
                  )}
                  icon={filter.icon}
                />
              </button>
            ))}
            {statusFilter.length > 0 && (
              <>
                <div className="my-1 border-t" />
                <button
                  className="w-full rounded-md px-2 py-1.5 text-left text-muted-foreground text-sm transition-colors hover:bg-accent hover:text-foreground"
                  onClick={() => setStatusFilter(null)}
                  type="button"
                >
                  Clear filters
                </button>
              </>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger
          render={(props) => (
            <Button
              {...props}
              className="h-10 rounded-full px-3 md:h-9 md:rounded-md"
              size="sm"
              variant="outline"
            >
              <span className="font-medium text-xs md:text-sm">
                {sortLabel}
              </span>
              <HugeiconsIcon
                className="ml-1 text-muted-foreground md:ml-auto md:opacity-50"
                icon={ArrowDown01Icon}
                size={14}
              />
            </Button>
          )}
        />
        <PopoverContent align="end" className="w-40 p-1">
          <Button
            className={cn(
              "w-full justify-start",
              sort === "recent" && "bg-accent"
            )}
            onClick={() => setSort("recent")}
            size="sm"
            variant="ghost"
          >
            Newest
          </Button>
          <Button
            className={cn(
              "w-full justify-start",
              sort === "votes" && "bg-accent"
            )}
            onClick={() => setSort("votes")}
            size="sm"
            variant="ghost"
          >
            Top Voted
          </Button>
        </PopoverContent>
      </Popover>

      <div className="relative hidden md:block">
        <HugeiconsIcon
          className="-translate-y-1/2 absolute top-1/2 left-2.5 text-muted-foreground"
          icon={Search01Icon}
          size={16}
        />
        <Input
          className="h-9 w-[200px] pl-9"
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          value={search}
        />
      </div>

      <Button
        className="h-10 w-10 rounded-full p-0 md:hidden"
        onClick={() => setMobileSearchOpen(true)}
        size="sm"
        variant="outline"
      >
        <HugeiconsIcon icon={Search01Icon} size={16} />
      </Button>

      <Dialog onOpenChange={setMobileSearchOpen} open={mobileSearchOpen}>
        <DialogPopup className="h-dvh max-w-none md:hidden">
          <div className="flex h-full flex-col bg-background">
            <div className="flex items-center justify-between border-b p-4">
              <DialogTitle className="sr-only">Search Feedback</DialogTitle>
              <DialogClose render={<Button size="sm" variant="ghost" />}>
                Close
              </DialogClose>
            </div>

            <div className="border-b p-4 pt-2">
              <InputGroup>
                <InputGroupInput
                  aria-label="Search"
                  autoFocus
                  className="h-12 rounded-xl text-base"
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search feedback..."
                  type="search"
                  value={search}
                />
                <InputGroupAddon>
                  <HugeiconsIcon
                    aria-hidden="true"
                    icon={Search01Icon}
                    size={18}
                  />
                </InputGroupAddon>
              </InputGroup>
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
