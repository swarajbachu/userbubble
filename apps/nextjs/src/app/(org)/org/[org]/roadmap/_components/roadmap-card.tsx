import type { FeedbackPost, User } from "@critichut/db/schema";
import { ChevronUp } from "lucide-react";
import Link from "next/link";

type RoadmapCardProps = {
  post: FeedbackPost;
  author: User | null;
  org: string;
};

export function RoadmapCard({ post, org }: RoadmapCardProps) {
  const categoryLabels = {
    feature_request: "Feature",
    bug: "Bug",
    improvement: "Improvement",
    question: "Question",
    other: "Other",
  };

  return (
    <Link href={`/${org}/feedback/${post.id}`}>
      <div className="rounded-lg border bg-card p-4 transition-shadow hover:shadow-md">
        <h3 className="mb-2 font-medium transition-colors hover:text-primary">
          {post.title}
        </h3>

        <p className="mb-3 line-clamp-2 text-muted-foreground text-sm">
          {post.description}
        </p>

        <div className="flex items-center justify-between">
          <span className="rounded-full bg-muted px-2 py-1 text-xs">
            {categoryLabels[post.category]}
          </span>

          <div className="flex items-center gap-1 text-muted-foreground text-sm">
            <ChevronUp className="h-4 w-4" />
            <span>{post.voteCount}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
