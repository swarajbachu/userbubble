"use client";

import { cn } from "@critichut/ui";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@critichut/ui/field";
import { Icon } from "@critichut/ui/icon";
import { Input } from "@critichut/ui/input";
import { Textarea } from "@critichut/ui/textarea";
import { tagConfig } from "~/components/changelog/config";
import { FeedbackSelector } from "./feedback-selector";
import type { useChangelogForm } from "./use-changelog-form";

type ChangelogEditorFormProps = {
  form: ReturnType<typeof useChangelogForm>;
  organizationId: string;
};

export function ChangelogEditorForm({
  form,
  organizationId,
}: ChangelogEditorFormProps) {
  return (
    <div className="rounded-lg border bg-card p-6">
      <FieldGroup className="space-y-6">
        {/* Title */}
        <form.Field name="title">
          {(field) => (
            <Field>
              <FieldLabel>Title</FieldLabel>
              <Input
                autoFocus
                maxLength={256}
                minLength={1}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="What's new in this update?"
                required
                type="text"
                value={field.state.value}
              />
              <FieldDescription>
                A clear, concise title for this changelog entry
              </FieldDescription>
            </Field>
          )}
        </form.Field>

        {/* Version */}
        <form.Field name="version">
          {(field) => (
            <Field>
              <FieldLabel>Version (optional)</FieldLabel>
              <Input
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="1.0.0"
                type="text"
                value={field.state.value}
              />
              <FieldDescription>
                Version number for this release
              </FieldDescription>
            </Field>
          )}
        </form.Field>

        {/* Description */}
        <form.Field name="description">
          {(field) => (
            <Field>
              <FieldLabel>Description</FieldLabel>
              <Textarea
                className="min-h-[300px]"
                maxLength={10_000}
                minLength={1}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="Describe the updates and changes in detail..."
                required
                value={field.state.value}
              />
              <FieldDescription>
                Detailed information about what changed
              </FieldDescription>
            </Field>
          )}
        </form.Field>

        {/* Cover Image URL */}
        <form.Field name="coverImageUrl">
          {(field) => (
            <Field>
              <FieldLabel>Cover Image URL (optional)</FieldLabel>
              <Input
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="https://example.com/image.png"
                type="url"
                value={field.state.value}
              />
              <FieldDescription>
                Direct link to an image for this update
              </FieldDescription>
            </Field>
          )}
        </form.Field>

        {/* Tags */}
        <form.Field name="tags">
          {(field) => (
            <Field>
              <FieldLabel>Tags</FieldLabel>
              <div className="flex flex-wrap gap-2">
                {Object.entries(tagConfig).map(([key, config]) => {
                  const isSelected = field.state.value.includes(key);
                  return (
                    <button
                      className={cn(
                        "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
                        isSelected
                          ? `${config.bg} border-primary`
                          : "border-input hover:bg-accent"
                      )}
                      key={key}
                      onClick={() => {
                        const current = field.state.value as string[];
                        if (isSelected) {
                          field.handleChange(current.filter((t) => t !== key));
                        } else {
                          field.handleChange([...current, key]);
                        }
                      }}
                      type="button"
                    >
                      <Icon
                        className={config.color}
                        icon={config.icon}
                        size={16}
                      />
                      <span className={config.color}>{config.label}</span>
                    </button>
                  );
                })}
              </div>
              <FieldDescription>
                Categorize this update with one or more tags
              </FieldDescription>
            </Field>
          )}
        </form.Field>

        {/* Linked Feedback */}
        <form.Field name="feedbackPostIds">
          {(field) => (
            <Field>
              <FieldLabel>Link Feedback (optional)</FieldLabel>
              <FeedbackSelector
                onValueChange={field.handleChange}
                organizationId={organizationId}
                value={field.state.value as string[]}
              />
              <FieldDescription>
                Link feedback posts that this update resolves
              </FieldDescription>
            </Field>
          )}
        </form.Field>
      </FieldGroup>
    </div>
  );
}
