"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Idea01Icon, Task01Icon } from "@hugeicons-pro/core-duotone-rounded";
import { cn } from "@userbubble/ui";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CreateFeedbackButton } from "./create-feedback-button";

type FeedbackSidebarProps = {
  org: string;
  organizationId: string;
  allowAnonymous: boolean;
};

export function FeedbackSidebar({
  org,
  organizationId,
  allowAnonymous,
}: FeedbackSidebarProps) {
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get("category");

  const boards = [
    {
      name: "All Feedback",
      count: null,
      category: null,
      color: "bg-gray-500",
    },
    {
      name: "Features",
      count: null,
      category: "feature_request",
      color: "bg-green-500",
    },
    {
      name: "Bugs",
      count: null,
      category: "bug",
      color: "bg-red-500",
    },
  ];

  return (
    <div className="flex w-full shrink-0 flex-col gap-6 md:w-64">
      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-foreground">
            <HugeiconsIcon
              className="text-primary"
              icon={Idea01Icon}
              size={20}
            />
            <h3 className="font-semibold">Got an idea?</h3>
          </div>
          <CreateFeedbackButton
            allowAnonymous={allowAnonymous}
            className="w-full font-semibold"
            organizationId={organizationId}
            variant="default"
          >
            Submit a Post
          </CreateFeedbackButton>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6 shadow-sm">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-foreground">
            <HugeiconsIcon
              className="text-primary"
              icon={Task01Icon}
              size={20}
            />
            <h3 className="font-semibold">Boards</h3>
          </div>

          <div className="flex flex-col gap-1">
            {boards.map((board) => {
              const isActive =
                currentCategory === board.category ||
                (!currentCategory && board.category === null);
              return (
                <Link
                  className={cn(
                    "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-secondary font-medium text-foreground"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  )}
                  href={`/feedback${
                    board.category ? `?category=${board.category}` : ""
                  }`}
                  key={board.name}
                >
                  <div className="flex items-center gap-2">
                    <div className={cn("h-2 w-2 rounded-full", board.color)} />
                    <span>{board.name}</span>
                  </div>
                  {board.count !== null && (
                    <span className="rounded-full border bg-background px-2 py-0.5 text-muted-foreground text-xs">
                      {board.count}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
