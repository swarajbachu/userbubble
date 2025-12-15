"use client";

import { ChangelogDisplay } from "./changelog-display";

type ChangelogEditorPreviewProps = {
  title: string;
  description: string;
  version: string;
  coverImageUrl: string;
  tags: string[];
  linkedFeedback?: { id: string; title: string }[];
  org: string;
};

export function ChangelogEditorPreview({
  title,
  description,
  version,
  coverImageUrl,
  tags,
  linkedFeedback,
  org,
}: ChangelogEditorPreviewProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 px-1">
        <h2 className="font-semibold text-muted-foreground text-sm">Preview</h2>
        <div className="h-px flex-1 bg-border" />
      </div>

      <ChangelogDisplay
        author="preview"
        coverImageUrl={coverImageUrl}
        date={new Date()}
        description={description}
        linkedFeedback={linkedFeedback}
        org={org}
        status="draft"
        tags={tags}
        title={title}
        version={version}
      />
    </div>
  );
}
