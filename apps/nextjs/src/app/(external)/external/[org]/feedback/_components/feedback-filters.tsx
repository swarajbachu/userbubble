"use client";

import { cn } from "@critichut/ui";
import { Button } from "@critichut/ui/button";
import { Input } from "@critichut/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@critichut/ui/popover";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowDown01Icon,
  FilterHorizontalIcon,
  Search01Icon,
} from "@hugeicons-pro/core-duotone-rounded";
import { parseAsString, useQueryState } from "nuqs";

export function FeedbackFilters() {
  const [search, setSearch] = useQueryState("q", parseAsString.withDefault(""));
  const [sort, setSort] = useQueryState(
    "sort",
    parseAsString.withDefault("recent")
  );

  return (
    <div className="flex items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button className="h-9 gap-2" size="sm" variant="outline">
            <HugeiconsIcon icon={FilterHorizontalIcon} size={16} />
            Filter
            <HugeiconsIcon
              className="ml-auto opacity-50"
              icon={ArrowDown01Icon}
              size={16}
            />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-48 p-0">
          <div className="p-2">
            <div className="px-2 py-1.5 font-medium text-muted-foreground text-sm">
              Status
            </div>
            {/* Add checkboxes here later */}
          </div>
        </PopoverContent>
      </Popover>

      <Popover>
        <PopoverTrigger asChild>
          <Button className="h-9 gap-2" size="sm" variant="outline">
            <HugeiconsIcon icon={ArrowDown01Icon} size={16} />
            {sort === "recent" ? "Newest" : "Top Voted"}
            <HugeiconsIcon
              className="ml-auto opacity-50"
              icon={ArrowDown01Icon}
              size={16}
            />
          </Button>
        </PopoverTrigger>
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
    </div>
  );
}
