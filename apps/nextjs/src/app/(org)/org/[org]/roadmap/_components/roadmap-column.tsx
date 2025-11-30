import type { FeedbackPost, User } from "@critichut/db/schema";
import { RoadmapCard } from "./roadmap-card";

type RoadmapColumnProps = {
  title: string;
  description: string;
  posts: Array<{ post: FeedbackPost; author: User | null }>;
  org: string;
  colorClass: string;
};

export function RoadmapColumn({
  title,
  description,
  posts,
  org,
  colorClass,
}: RoadmapColumnProps) {
  return (
    <div>
      <div className="mb-4">
        <h2 className="mb-1 font-semibold text-xl">{title}</h2>
        <p className="text-muted-foreground text-sm">{description}</p>
        <div className="mt-2 text-muted-foreground text-sm">
          {posts.length} {posts.length === 1 ? "item" : "items"}
        </div>
      </div>

      <div className={`space-y-3 rounded-lg border-2 ${colorClass} p-4`}>
        {posts.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-sm">
            No items yet
          </div>
        ) : (
          posts.map((item) => (
            <RoadmapCard
              author={item.author}
              key={item.post.id}
              org={org}
              post={item.post}
            />
          ))
        )}
      </div>
    </div>
  );
}
