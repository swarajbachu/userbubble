"use client";

import type { DateRange } from "@critichut/ui";
import { Badge } from "@critichut/ui/badge";
import { Button } from "@critichut/ui/button";
import { Calendar } from "@critichut/ui/calendar";
import { Checkbox } from "@critichut/ui/checkbox";
import { Icon } from "@critichut/ui/icon";
import { Popover, PopoverContent, PopoverTrigger } from "@critichut/ui/popover";
import {
  Calendar03Icon,
  Cancel01Icon,
  FilterIcon,
} from "@hugeicons-pro/core-bulk-rounded";
import { format } from "date-fns";
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";
import { tagConfig } from "~/components/changelog/config";

export function ChangelogFilters() {
  const [tags, setTags] = useQueryState(
    "tags",
    parseAsArrayOf(parseAsString).withDefault([])
  );
  const [dateFrom, setDateFrom] = useQueryState("from", parseAsString);
  const [dateTo, setDateTo] = useQueryState("to", parseAsString);

  const hasActiveFilters = tags.length > 0 || dateFrom || dateTo;

  const handleTagToggle = (tag: string) => {
    if (tags.includes(tag)) {
      const newTags = tags.filter((t) => t !== tag);
      setTags(newTags.length > 0 ? newTags : null);
    } else {
      setTags([...tags, tag]);
    }
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    if (range?.from) {
      setDateFrom(range.from.toISOString());
    } else {
      setDateFrom(null);
    }

    if (range?.to) {
      setDateTo(range.to.toISOString());
    } else {
      setDateTo(null);
    }
  };

  const clearFilters = () => {
    setTags(null);
    setDateFrom(null);
    setDateTo(null);
  };

  const dateRange: DateRange | undefined =
    dateFrom || dateTo
      ? {
          from: dateFrom ? new Date(dateFrom) : undefined,
          to: dateTo ? new Date(dateTo) : undefined,
        }
      : undefined;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Tag filter */}
      <Popover>
        <PopoverTrigger>
          <Button size="sm" variant="outline">
            <Icon icon={FilterIcon} size={16} />
            Tags
            {tags.length > 0 && (
              <Badge className="ml-1 h-5 min-w-5 px-1" variant="secondary">
                {tags.length}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[280px] p-3">
          <div className="space-y-2">
            <p className="font-medium text-sm">Filter by tags</p>
            <div className="space-y-1.5">
              {Object.entries(tagConfig).map(([key, config]) => (
                <label
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-accent"
                  htmlFor={`tag-${key}`}
                  key={key}
                >
                  <Checkbox
                    checked={tags.includes(key)}
                    id={`tag-${key}`}
                    onCheckedChange={() => handleTagToggle(key)}
                  />
                  <Icon className={config.color} icon={config.icon} size={16} />
                  <span className="flex-1 text-sm">{config.label}</span>
                </label>
              ))}
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Date range filter */}
      <Popover>
        <PopoverTrigger>
          <Button size="sm" variant="outline">
            <Icon icon={Calendar03Icon} size={16} />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, "MMM d")} -{" "}
                  {format(dateRange.to, "MMM d, yyyy")}
                </>
              ) : (
                format(dateRange.from, "MMM d, yyyy")
              )
            ) : (
              "Date Range"
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto p-0">
          <Calendar
            defaultMonth={dateRange?.from}
            mode="range"
            numberOfMonths={2}
            onSelect={handleDateRangeChange}
            selected={dateRange}
          />
        </PopoverContent>
      </Popover>

      {/* Clear filters button */}
      {hasActiveFilters && (
        <Button onClick={clearFilters} size="sm" variant="ghost">
          <Icon icon={Cancel01Icon} size={16} />
          Clear
        </Button>
      )}
    </div>
  );
}
