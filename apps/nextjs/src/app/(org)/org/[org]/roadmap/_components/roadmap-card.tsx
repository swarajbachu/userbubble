import type { FeedbackPost, FeedbackVote, User } from "@critichut/db/schema";
import Link from "next/link";
import { VoteButton } from "../../feedback/_components/vote-button";

type RoadmapCardProps = {
  post: FeedbackPost;
  author: User | null;
  org: string;
  userVote: FeedbackVote | null; // NEW
};

export function RoadmapCard({ post, org, userVote }: RoadmapCardProps) {
  const categoryLabels = {
    feature_request: "Feature",
    bug: "Bug",
    improvement: "Improvement",
    question: "Question",
    other: "Other",
  };

  return (
    <Link className="group block" href={`/${org}/feedback/${post.id}`}>
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-xs transition-all hover:border-primary/50 hover:shadow-md dark:bg-muted/40">
        <h3 className="font-medium text-sm leading-normal transition-colors group-hover:text-primary">
          {post.title}
        </h3>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1.5 rounded-full bg-secondary px-2 py-0.5 font-medium text-secondary-foreground">
              {categoryLabels[post.category]}
            </span>
            <span>
              {new Date(post.createdAt).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>

          {/** biome-ignore lint/a11y/noNoninteractiveElementInteractions: <explanation> */}
          {/** biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
          {/** biome-ignore lint/a11y/noStaticElementInteractions: <explanation> */}
          <div onClick={(e) => e.preventDefault()}>
            <VoteButton
              className="h-6 w-auto gap-1 px-2 py-0 text-[10px]"
              initialVotes={post.voteCount}
              postId={post.id}
              userVote={userVote} // NEW: pass user vote
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
