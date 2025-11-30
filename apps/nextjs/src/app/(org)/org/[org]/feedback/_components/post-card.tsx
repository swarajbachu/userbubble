"use client";

import type { FeedbackPost, User } from "@critichut/db/schema";
import { cn } from "@critichut/ui";
import { Icon } from "@critichut/ui/icon";
import {
  Cancel01Icon,
  CheckmarkBadge01Icon,
  CircleIcon,
  Clock01Icon,
  EyeIcon,
  HourglassIcon,
} from "@hugeicons-pro/core-duotone-rounded";
import Link from "next/link";
import { VoteButton } from "./vote-button";

type PostCardProps = {
  post: FeedbackPost;
  author: User | null;
  org: string;
};

export function PostCard({ post, org }: PostCardProps) {
  const statusConfig = {
    open: { color: "text-blue-500", icon: CircleIcon },
    under_review: { color: "text-yellow-500", icon: EyeIcon },
    planned: { color: "text-purple-500", icon: Clock01Icon },
    in_progress: { color: "text-orange-500", icon: HourglassIcon },
    completed: { color: "text-green-500", icon: CheckmarkBadge01Icon },
    closed: { color: "text-slate-500", icon: Cancel01Icon },
  };

  const categoryLabels = {
    feature_request: "Feature",
    bug: "Bug",
    improvement: "Improvement",
    question: "Question",
    other: "Other",
  };

  const config = statusConfig[post.status];

  return (
    <div className="group flex items-center gap-4 border-b p-3 last:border-0">
      <div className="flex-none">
        <VoteButton
          className="h-6 w-auto gap-1 px-2 py-0 text-[10px]"
          initialVotes={post.voteCount}
          postId={post.id}
        />
      </div>

      <div className="min-w-0 flex-1">
        <Link
          className="flex items-center gap-2"
          href={`/org/${org}/feedback/${post.id}`}
        >
          <span className="truncate font-medium text-sm transition-colors group-hover:text-primary">
            {post.title}
          </span>
        </Link>
      </div>

      <div className="flex flex-none items-center gap-4 text-muted-foreground text-xs">
        <div className="hidden items-center gap-1.5 sm:flex">
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full",
              config.color.replace("text-", "bg-")
            )}
          />
          <span>{categoryLabels[post.category]}</span>
        </div>

        <div className="flex items-center gap-1.5">
          <Icon className={cn("size-3.5", config.color)} icon={config.icon} />
          <span className="capitalize">{post.status.replace("_", " ")}</span>
        </div>

        <div className="hidden w-24 justify-end sm:flex">
          {new Date(post.createdAt).toLocaleDateString(undefined, {
            month: "short",
            day: "numeric",
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="size-5 rounded-full bg-linear-to-br from-primary/20 to-primary/10" />
        </div>
      </div>
    </div>
  );
}
