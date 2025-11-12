"use client";

import { Button } from "@critichut/ui/button";
import { useRouter, useSearchParams } from "next/navigation";

interface FeedbackFiltersProps {
  org: string;
}

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
        <span className="text-muted-foreground text-sm font-medium">
          Sort by:
        </span>
        <div className="flex gap-2">
          <Button
            variant={currentSort === "recent" ? "default" : "outline"}
            size="sm"
            onClick={() => updateFilter("sort", "recent")}
          >
            Recent
          </Button>
          <Button
            variant={currentSort === "votes" ? "default" : "outline"}
            size="sm"
            onClick={() => updateFilter("sort", "votes")}
          >
            Most Voted
          </Button>
        </div>
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-sm font-medium">
          Status:
        </span>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={currentStatus === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => updateFilter("status", "all")}
          >
            All
          </Button>
          <Button
            variant={currentStatus === "open" ? "default" : "outline"}
            size="sm"
            onClick={() => updateFilter("status", "open")}
          >
            Open
          </Button>
          <Button
            variant={currentStatus === "planned" ? "default" : "outline"}
            size="sm"
            onClick={() => updateFilter("status", "planned")}
          >
            Planned
          </Button>
          <Button
            variant={currentStatus === "in_progress" ? "default" : "outline"}
            size="sm"
            onClick={() => updateFilter("status", "in_progress")}
          >
            In Progress
          </Button>
          <Button
            variant={currentStatus === "completed" ? "default" : "outline"}
            size="sm"
            onClick={() => updateFilter("status", "completed")}
          >
            Completed
          </Button>
        </div>
      </div>
    </div>
  );
}
