"use client";

import { Button } from "@critichut/ui/button";
import { useRouter, useSearchParams } from "next/navigation";

type FeedbackFiltersProps = {
  org: string;
};

export function FeedbackFilters({ org }: FeedbackFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSort = searchParams.get("sort") ?? "recent";
  const currentStatus = searchParams.get("status") ?? "all";

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || value === "recent") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/${org}/feedback?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-4">
      {/* Sort options */}
      <div className="flex items-center gap-2">
        <span className="font-medium text-muted-foreground text-sm">
          Sort by:
        </span>
        <div className="flex gap-2">
          <Button
            onClick={() => updateFilter("sort", "recent")}
            size="sm"
            variant={currentSort === "recent" ? "default" : "outline"}
          >
            Recent
          </Button>
          <Button
            onClick={() => updateFilter("sort", "votes")}
            size="sm"
            variant={currentSort === "votes" ? "default" : "outline"}
          >
            Most Voted
          </Button>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-2">
        <span className="font-medium text-muted-foreground text-sm">
          Status:
        </span>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => updateFilter("status", "all")}
            size="sm"
            variant={currentStatus === "all" ? "default" : "outline"}
          >
            All
          </Button>
          <Button
            onClick={() => updateFilter("status", "open")}
            size="sm"
            variant={currentStatus === "open" ? "default" : "outline"}
          >
            Open
          </Button>
          <Button
            onClick={() => updateFilter("status", "planned")}
            size="sm"
            variant={currentStatus === "planned" ? "default" : "outline"}
          >
            Planned
          </Button>
          <Button
            onClick={() => updateFilter("status", "in_progress")}
            size="sm"
            variant={currentStatus === "in_progress" ? "default" : "outline"}
          >
            In Progress
          </Button>
          <Button
            onClick={() => updateFilter("status", "completed")}
            size="sm"
            variant={currentStatus === "completed" ? "default" : "outline"}
          >
            Completed
          </Button>
        </div>
      </div>
    </div>
  );
}
