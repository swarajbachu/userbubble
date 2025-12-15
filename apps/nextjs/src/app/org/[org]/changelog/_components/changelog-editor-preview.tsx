"use client";

import { Badge } from "@critichut/ui/badge";
import {
  DoubleCard,
  DoubleCardHeader,
  DoubleCardInner,
} from "@critichut/ui/double-card";
import { Icon } from "@critichut/ui/icon";
import { tagConfig } from "~/components/changelog/config";

type ChangelogEditorPreviewProps = {
  title: string;
  description: string;
  version: string;
  coverImageUrl: string;
  tags: string[];
};

export function ChangelogEditorPreview({
  title,
  description,
  version,
  coverImageUrl,
  tags,
}: ChangelogEditorPreviewProps) {
  const mockDate = new Date();

  return (
    <div className="space-y-4">
      {/* Preview label */}
      <div className="flex items-center gap-2 px-1">
        <h2 className="font-semibold text-muted-foreground text-sm">Preview</h2>
        <div className="h-px flex-1 bg-border" />
      </div>

      {/* Preview card */}
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
                <time dateTime={mockDate.toISOString()}>
                  {mockDate.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </time>
                <span>•</span>
                <span>by You</span>
                <span>•</span>
                <Badge variant="outline">Draft</Badge>
              </div>
            </div>
          </div>
        </DoubleCardHeader>

        <DoubleCardInner className="space-y-4">
          {/* Cover image */}
          {coverImageUrl && (
            <div className="overflow-hidden rounded-lg">
              <img
                alt={title || "Cover image"}
                className="h-auto w-full object-cover"
                src={coverImageUrl}
              />
            </div>
          )}

          {/* Description */}
          {description ? (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap text-foreground/90 leading-relaxed">
                {description}
              </p>
            </div>
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
                if (!config) return null;

                return (
                  <Badge className={config.bg} key={tag} variant="secondary">
                    <Icon
                      className={config.color}
                      icon={config.icon}
                      size={12}
                    />
                    <span className={config.color}>{config.label}</span>
                  </Badge>
                );
              })}
            </div>
          )}
        </DoubleCardInner>
      </DoubleCard>
    </div>
  );
}
