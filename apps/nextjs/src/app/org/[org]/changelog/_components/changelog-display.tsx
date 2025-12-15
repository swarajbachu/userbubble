"use client";

import { Badge } from "@critichut/ui/badge";
import {
  DoubleCard,
  DoubleCardHeader,
  DoubleCardInner,
} from "@critichut/ui/double-card";
import { Icon } from "@critichut/ui/icon";
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
  version,
  coverImageUrl,
  tags,
  linkedFeedback,
  author,
  date,
  status,
  org,
  actions,
}: ChangelogDisplayProps) {
  return (
    <DoubleCard>
      <DoubleCardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-2">
            {/* Title and version */}
            <div className="flex items-center gap-2">
              {version && (
                <Badge className="shrink-0" variant="secondary">
                  v{version}
                </Badge>
              )}
              <h3 className="truncate font-semibold text-lg">
                {title || "Untitled Entry"}
              </h3>
            </div>

            {/* Metadata */}
            <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-xs">
              <time dateTime={date.toISOString()}>
                {new Date(date).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </time>
              {author && (
                <>
                  <span>•</span>
                  <span>by {author === "preview" ? "You" : author.name}</span>
                </>
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
            className="tiptap-content"
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
