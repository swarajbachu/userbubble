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
import { cn } from "@userbubble/ui";
import { Button } from "@userbubble/ui/button";
import { Checkbox } from "@userbubble/ui/checkbox";
import { Icon } from "@userbubble/ui/icon";
import { Input } from "@userbubble/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@userbubble/ui/popover";
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";

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

export function FeedbackFilters() {
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [sort, setSort] = useQueryState(
    "sort",
    parseAsString.withDefault("recent")
  );

  const [statusFilter, setStatusFilter] = useQueryState(
    "status",
    parseAsArrayOf(parseAsString).withDefault([])
  );

  const isStatusActive = (value: string) => statusFilter.includes(value);

  const toggleStatus = (value: string) => {
    if (statusFilter.includes(value)) {
      const newStatus = statusFilter.filter((s) => s !== value);
      setStatusFilter(newStatus.length > 0 ? newStatus : null);
    } else {
      setStatusFilter([...statusFilter, value]);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger
          render={(props) => (
            <Button
              {...props}
              className="h-9 gap-2"
              size="sm"
              variant="outline"
            >
              <HugeiconsIcon icon={FilterHorizontalIcon} size={16} />
              Filter
              {statusFilter.length > 0 && (
                <span className="rounded-full bg-primary px-1.5 py-0.5 font-medium text-primary-foreground text-xs">
                  {statusFilter.length}
                </span>
              )}
              <HugeiconsIcon
                className="ml-auto opacity-50"
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
              className="h-9 gap-2"
              size="sm"
              variant="outline"
            >
              {sort === "recent" ? "Newest" : "Top Voted"}
              <HugeiconsIcon
                className="ml-auto opacity-50"
                icon={ArrowDown01Icon}
                size={16}
              />
            </Button>
          )}
        />
        <PopoverContent align="start" className="w-40 p-1">
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

      <div className="relative">
        <HugeiconsIcon
          className="absolute top-1/2 left-2.5 -translate-y-1/2 text-muted-foreground"
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
    </div>
  );
}
