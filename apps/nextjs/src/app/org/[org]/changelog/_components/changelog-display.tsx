"use client";

import { Badge } from "@userbubble/ui/badge";
import {
  DoubleCard,
  DoubleCardHeader,
  DoubleCardInner,
} from "@userbubble/ui/double-card";
import { Icon } from "@userbubble/ui/icon";
import Image from "next/image";
import { tagConfig } from "~/components/changelog/config";
import { LinkedFeedbackList } from "./linked-feedback-list";

type ChangelogDisplayProps = {
  title: string;
  description: string;
  version?: string | null;
  coverImageUrl?: string | null;
  tags?: string[];
  linkedFeedback?: Array<{ id: string; title: string }>;
  author?: { name: string } | "preview";
  date: Date;
  status?: "draft" | "published";
  org: string;
  actions?: React.ReactNode;
};

export function ChangelogDisplay({
  title,
  description,
  coverImageUrl,
  tags,
  linkedFeedback,
  author,
  status,
  org,
  actions,
}: ChangelogDisplayProps) {
  return (
    <DoubleCard>
      <DoubleCardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-2">
            {/* Title */}
            <h3 className="truncate font-semibold text-xl">
              {title || "Untitled Entry"}
            </h3>

            {/* Metadata (Author & Status only) */}
            <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
              {author && (
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded-full bg-gradient-to-br from-primary/20 to-primary/10" />
                  <span>{author === "preview" ? "You" : author.name}</span>
                </div>
              )}
              {status && (
                <>
                  <span>•</span>
                  <Badge variant="outline">
                    {status === "draft" ? "Draft" : "Published"}
                  </Badge>
                </>
              )}
            </div>
          </div>

          {/* Admin actions slot */}
          {actions}
        </div>
      </DoubleCardHeader>

      <DoubleCardInner className="space-y-4 p-4">
        {/* Cover image */}
        {coverImageUrl && (
          <div className="overflow-hidden rounded-lg">
            <Image
              alt={title || "Cover image"}
              className="h-auto w-full object-cover"
              height={0}
              sizes="100vw"
              src={coverImageUrl}
              style={{ width: "100%", height: "auto" }}
              unoptimized
              width={0}
            />
          </div>
        )}

        {/* Description */}
        {description ? (
          <div
            className="tiptap-content prose prose-sm dark:prose-invert max-w-none"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: Tiptap editor sanitizes content
            dangerouslySetInnerHTML={{ __html: description }}
          />
        ) : (
          <p className="text-muted-foreground text-sm italic">
            No description yet...
          </p>
        )}

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {tags.map((tag) => {
              const config = tagConfig[tag as keyof typeof tagConfig];
              if (!config) {
                return null;
              }

              return (
                <Badge className={config.bg} key={tag} variant="secondary">
                  <Icon className={config.color} icon={config.icon} size={12} />
                  <span className={config.color}>{config.label}</span>
                </Badge>
              );
            })}
          </div>
        )}

        {/* Linked feedback */}
        {linkedFeedback && linkedFeedback.length > 0 && (
          <LinkedFeedbackList feedback={linkedFeedback} org={org} />
        )}
      </DoubleCardInner>
    </DoubleCard>
  );
}
