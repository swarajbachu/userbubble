"use client";

import type { FeedbackPost, User } from "@critichut/db/schema";
import Link from "next/link";
import { VoteButton } from "./vote-button";

type PostCardProps = {
  post: FeedbackPost;
  author: User | null;
  org: string;
};

export function PostCard({ post, author, org }: PostCardProps) {
  const statusColors = {
    open: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    under_review:
      "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    planned:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    in_progress:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    completed:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    closed: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  const categoryLabels = {
    feature_request: "Feature",
    bug: "Bug",
    improvement: "Improvement",
    question: "Question",
    other: "Other",
  };

  return (
    <div className="flex gap-4 rounded-lg border bg-card p-4 transition-shadow hover:shadow-md">
      {/* Vote section */}
      <div className="flex flex-col items-center gap-1">
        <VoteButton initialVotes={post.voteCount} postId={post.id} />
      </div>

      {/* Content section */}
      <div className="flex-1">
        <Link className="group block" href={`/${org}/feedback/${post.id}`}>
          <h3 className="mb-2 font-semibold text-lg transition-colors group-hover:text-primary">
            {post.title}
          </h3>
        </Link>

        <p className="mb-3 line-clamp-2 text-muted-foreground text-sm">
          {post.description}
        </p>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status badge */}
          <span
            className={`rounded-full px-2 py-1 font-medium text-xs ${statusColors[post.status]}`}
          >
            {post.status.replace("_", " ").toUpperCase()}
          </span>

          {/* Category badge */}
          <span className="rounded-full bg-muted px-2 py-1 text-xs">
            {categoryLabels[post.category]}
          </span>

          {/* Author and date */}
          <span className="text-muted-foreground text-xs">
            by {author?.name ?? "Anonymous"} •{" "}
            {new Date(post.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>
    </div>
  );
}
