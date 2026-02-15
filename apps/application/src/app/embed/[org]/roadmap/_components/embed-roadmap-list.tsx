"use client";

import { useQuery } from "@tanstack/react-query";
import { cn } from "@userbubble/ui";
import { categoryLabels, statusConfig } from "~/components/feedback/config";
import { getEmbedToken } from "~/lib/embed-auth-store";
import { useTRPC } from "~/trpc/react";

type EmbedRoadmapListProps = {
  organizationId: string;
  orgSlug: string;
};

const statusOrder = ["in_progress", "planned", "completed"] as const;

const statusMeta: Record<
  (typeof statusOrder)[number],
  { label: string; dotColor: string }
> = {
  in_progress: { label: "In Progress", dotColor: "bg-orange-500" },
  planned: { label: "Planned", dotColor: "bg-purple-500" },
  completed: { label: "Completed", dotColor: "bg-emerald-500" },
};

function getPostUrl(orgSlug: string, postId: string): string {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ?? "https://app.userbubble.com";
  // Replace the app subdomain with the org slug (e.g. app.host.local → orgSlug.host.local)
  const parsed = new URL(appUrl);
  const hostParts = parsed.host.split(".");
  hostParts[0] = orgSlug;
  const orgBaseUrl = `${parsed.protocol}//${hostParts.join(".")}`;
  const token = getEmbedToken();
  const url = `${orgBaseUrl}/feedback/${postId}`;
  return token ? `${url}?auth_token=${encodeURIComponent(token)}` : url;
}

export function EmbedRoadmapList({
  organizationId,
  orgSlug,
}: EmbedRoadmapListProps) {
  const trpc = useTRPC();

  const { data: allPosts, isLoading } = useQuery(
    trpc.feedback.getAll.queryOptions({
      organizationId,
      sortBy: "votes",
    })
  );

  if (isLoading) {
    return (
      <div className="space-y-6 p-5">
        {[1, 2, 3].map((i) => (
          <div className="flex gap-3" key={i}>
            <div className="h-3 w-3 shrink-0 animate-pulse rounded-full bg-muted" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-20 animate-pulse rounded bg-muted" />
              <div className="h-10 animate-pulse rounded-lg bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  const grouped = statusOrder.map((status) => ({
    status,
    ...statusMeta[status],
    posts: allPosts?.filter((p) => p.post.status === status) ?? [],
  }));

  return (
    <div className="p-5">
      <div className="relative">
        {/* Vertical timeline line */}
        <div className="absolute top-0 bottom-0 left-[5px] w-px bg-border" />

        <div className="space-y-5">
          {grouped.map((group) => (
            <div className="relative" key={group.status}>
              {/* Status header */}
              <div className="flex items-center gap-3 pb-2">
                <div
                  className={cn(
                    "relative z-10 h-[11px] w-[11px] rounded-full ring-2 ring-background",
                    group.dotColor
                  )}
                />
                <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wider">
                  {group.label}
                </span>
                <span className="rounded-full bg-muted px-1.5 py-0.5 font-medium text-[10px] text-muted-foreground">
                  {group.posts.length}
                </span>
              </div>

              {/* Posts under this status */}
              <div className="ml-[11px] border-l-0 pl-5">
                {group.posts.length === 0 ? (
                  <p className="py-2 text-muted-foreground/60 text-xs">
                    Nothing here yet
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {group.posts.map((item) => (
                      <a
                        className="block rounded-lg border px-3 py-2.5 transition-colors hover:bg-muted/50"
                        href={getPostUrl(orgSlug, item.post.id)}
                        key={item.post.id}
                        rel="noopener"
                        target="_blank"
                      >
                        <p className="font-medium text-sm leading-snug">
                          {item.post.title}
                        </p>
                        <div className="mt-1 flex items-center gap-2">
                          <span
                            className={cn(
                              "h-1.5 w-1.5 rounded-full",
                              statusConfig[item.post.status].color.replace(
                                "text-",
                                "bg-"
                              )
                            )}
                          />
                          <span className="text-[11px] text-muted-foreground">
                            {categoryLabels[item.post.category]}
                          </span>
                          <span className="text-[11px] text-muted-foreground/50">
                            &middot;
                          </span>
                          <span className="text-[11px] text-muted-foreground/70">
                            {item.post.voteCount}{" "}
                            {item.post.voteCount === 1 ? "vote" : "votes"}
                          </span>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
