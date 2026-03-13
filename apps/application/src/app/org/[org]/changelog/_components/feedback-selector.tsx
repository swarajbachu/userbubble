"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Cancel01Icon,
  CheckmarkBadge01Icon,
  Link03Icon,
  Search01Icon,
} from "@hugeicons-pro/core-bulk-rounded";
import { useSuspenseQuery } from "@tanstack/react-query";
import { cn } from "@userbubble/ui";
import { Button } from "@userbubble/ui/button";
import { Checkbox } from "@userbubble/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogFooter,
  DialogPopup,
  DialogTitle,
} from "@userbubble/ui/dialog";
import { Icon } from "@userbubble/ui/icon";
import { useState } from "react";
import { getStatus } from "~/components/feedback/config";
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
  const [draft, setDraft] = useState<string[]>(value);

  const { data: posts } = useSuspenseQuery(
    trpc.feedback.getAll.queryOptions({
      organizationId,
      status: ["completed"],
    })
  );

  const filteredPosts = posts.filter((item) =>
    item.post.title.toLowerCase().includes(search.toLowerCase())
  );

  const selectedPosts = posts.filter((item) => value.includes(item.post.id));

  const toggleDraft = (postId: string) => {
    if (draft.includes(postId)) {
      setDraft(draft.filter((id) => id !== postId));
    } else {
      setDraft([...draft, postId]);
    }
  };

  const handleOpen = () => {
    setDraft(value);
    setSearch("");
    setOpen(true);
  };

  const handleConfirm = () => {
    onValueChange(draft);
    setOpen(false);
  };

  const removePost = (postId: string) => {
    onValueChange(value.filter((id) => id !== postId));
  };

  return (
    <div className="space-y-2">
      {/* Selected posts as chips */}
      {selectedPosts.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedPosts.map((item) => {
            const status = getStatus(item.post.status);
            return (
              <span
                className="inline-flex items-center gap-1.5 rounded-md border bg-muted/50 py-0.5 pr-1 pl-2 text-xs"
                key={item.post.id}
              >
                {status && (
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      status.color.replace("text-", "bg-")
                    )}
                  />
                )}
                <span className="max-w-[180px] truncate">
                  {item.post.title}
                </span>
                <button
                  className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                  onClick={() => removePost(item.post.id)}
                  type="button"
                >
                  <Icon icon={Cancel01Icon} size={10} />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* Trigger */}
      <Button
        className="w-full justify-start gap-2 text-muted-foreground"
        onClick={handleOpen}
        size="sm"
        type="button"
        variant="outline"
      >
        <Icon icon={Link03Icon} size={14} />
        {selectedPosts.length > 0
          ? `${selectedPosts.length} linked`
          : "Link feedback posts"}
      </Button>

      {/* Full dialog for selection */}
      <Dialog onOpenChange={setOpen} open={open}>
        <DialogPopup className="sm:max-w-[520px]">
          <DialogTitle className="sr-only">Select feedback posts</DialogTitle>

          {/* Search bar */}
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <HugeiconsIcon
              className="text-muted-foreground"
              icon={Search01Icon}
              size={16}
            />
            <input
              autoFocus
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search completed feedback..."
              value={search}
            />
            {draft.length > 0 && (
              <span className="rounded-md bg-primary/10 px-2 py-0.5 font-medium text-primary text-xs">
                {draft.length} selected
              </span>
            )}
          </div>

          {/* Post list */}
          <div className="max-h-[360px] overflow-y-auto p-2">
            {filteredPosts.length === 0 ? (
              <div className="flex flex-col items-center gap-2 p-8 text-center">
                <Icon
                  className="text-muted-foreground/40"
                  icon={CheckmarkBadge01Icon}
                  size={28}
                />
                <p className="text-muted-foreground text-sm">
                  {search
                    ? "No matching posts"
                    : "No completed feedback posts yet"}
                </p>
              </div>
            ) : (
              <div className="space-y-0.5">
                {filteredPosts.map((item) => {
                  const isSelected = draft.includes(item.post.id);
                  const status = getStatus(item.post.status);
                  return (
                    <label
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-accent",
                        isSelected && "bg-accent/50"
                      )}
                      htmlFor={`fb-${item.post.id}`}
                      key={item.post.id}
                    >
                      <Checkbox
                        checked={isSelected}
                        id={`fb-${item.post.id}`}
                        onCheckedChange={() => toggleDraft(item.post.id)}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm">{item.post.title}</p>
                        <div className="mt-0.5 flex items-center gap-2 text-muted-foreground text-xs">
                          {status && (
                            <span className="flex items-center gap-1">
                              <span
                                className={cn(
                                  "h-1.5 w-1.5 rounded-full",
                                  status.color.replace("text-", "bg-")
                                )}
                              />
                              {status.label}
                            </span>
                          )}
                          <span>{item.post.voteCount} votes</span>
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <DialogFooter className="border-t px-4 py-3">
            <DialogClose render={<Button size="sm" variant="ghost" />}>
              Cancel
            </DialogClose>
            <Button onClick={handleConfirm} size="sm">
              Link {draft.length > 0 ? `${draft.length} posts` : "posts"}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </div>
  );
}
