import type { FeedbackPost, User } from "@critichut/db/schema";
import { cn } from "@critichut/ui";
import { Icon } from "@critichut/ui/icon";
import type { ComponentProps } from "react";
import { RoadmapCard } from "./roadmap-card";

type RoadmapColumnProps = {
  title: string;
  description: string;
  posts: Array<{ post: FeedbackPost; author: User | null }>;
  org: string;
  icon: ComponentProps<typeof Icon>["icon"];
  color: string;
};

export function RoadmapColumn({
  title,
  description,
  posts,
  org,
  icon,
  color,
}: RoadmapColumnProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Icon className={cn("size-5", color)} icon={icon} />
            <h2 className="font-semibold text-lg">{title}</h2>
          </div>
          <p className="mt-1 text-muted-foreground text-sm">{description}</p>
        </div>
        <span className="rounded-full bg-muted px-2 py-0.5 font-medium text-xs">
          {posts.length}
        </span>
      </div>

      <div className="flex-1 space-y-3 rounded-xl bg-muted/50 p-2">
        {posts.length === 0 ? (
          <div className="flex h-full min-h-[200px] items-center justify-center rounded-lg border-2 border-dashed py-8 text-center text-muted-foreground text-sm">
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
