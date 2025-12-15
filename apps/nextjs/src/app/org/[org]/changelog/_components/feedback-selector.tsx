"use client";

import { Badge } from "@critichut/ui/badge";
import { Button } from "@critichut/ui/button";
import { Icon } from "@critichut/ui/icon";
import { Input } from "@critichut/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@critichut/ui/popover";
import {
  Cancel01Icon,
  CheckmarkBadge01Icon,
} from "@hugeicons-pro/core-bulk-rounded";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTRPC } from "~/trpc/react";

type FeedbackSelectorProps = {
  organizationId: string;
  value: string[];
  onValueChange: (value: string[]) => void;
};

export function FeedbackSelector({
  organizationId,
  value,
  onValueChange,
}: FeedbackSelectorProps) {
  const trpc = useTRPC();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  // Fetch completed feedback posts
  const { data: posts } = useSuspenseQuery(
    trpc.feedback.getAll.queryOptions({
      organizationId,
      status: ["completed"],
    })
  );

  // Filter posts by search
  const filteredPosts = posts.filter((item) =>
    item.post.title.toLowerCase().includes(search.toLowerCase())
  );

  const selectedPosts = posts.filter((item) => value.includes(item.post.id));

  const togglePost = (postId: string) => {
    if (value.includes(postId)) {
      onValueChange(value.filter((id) => id !== postId));
    } else {
      onValueChange([...value, postId]);
    }
  };

  return (
    <div className="space-y-2">
      {/* Selected posts */}
      {selectedPosts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedPosts.map((item) => (
            <Badge key={item.post.id} variant="secondary">
              <span className="max-w-[200px] truncate">{item.post.title}</span>
              <button onClick={() => togglePost(item.post.id)} type="button">
                <Icon icon={Cancel01Icon} size={12} />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Selector */}
      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger>
          <Button
            className="w-full justify-start"
            type="button"
            variant="outline"
          >
            <Icon icon={CheckmarkBadge01Icon} size={16} />
            {selectedPosts.length > 0
              ? `${selectedPosts.length} feedback post${selectedPosts.length === 1 ? "" : "s"} selected`
              : "Select feedback posts"}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[400px] p-0">
          <div className="flex flex-col">
            {/* Search */}
            <div className="border-b p-2">
              <Input
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search feedback..."
                type="text"
                value={search}
              />
            </div>

            {/* List */}
            <div className="max-h-[300px] overflow-y-auto p-1">
              {filteredPosts.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  {search
                    ? "No matching feedback posts"
                    : "No completed feedback posts"}
                </div>
              ) : (
                <div className="space-y-0.5">
                  {filteredPosts.map((item) => {
                    const isSelected = value.includes(item.post.id);
                    return (
                      <button
                        className="flex w-full items-start gap-2 rounded-md px-2 py-2 text-left text-sm transition-colors hover:bg-accent"
                        key={item.post.id}
                        onClick={() => togglePost(item.post.id)}
                        type="button"
                      >
                        <div
                          className={`mt-0.5 h-4 w-4 shrink-0 rounded border ${
                            isSelected
                              ? "border-primary bg-primary"
                              : "border-input"
                          }`}
                        >
                          {isSelected && (
                            <Icon
                              className="text-primary-foreground"
                              icon={CheckmarkBadge01Icon}
                              size={16}
                            />
                          )}
                        </div>
                        <span className="flex-1">{item.post.title}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
