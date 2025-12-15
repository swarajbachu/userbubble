"use client";

import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@critichut/ui/field";
import { Input } from "@critichut/ui/input";
import { Textarea } from "@critichut/ui/textarea";
import { ChangelogTagSelector } from "./changelog-tag-selector";
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
    <FieldGroup className="grid gap-6">
      <div className="grid gap-4 sm:grid-cols-4">
        {/* Title */}
        <form.Field name="title">
          {(field) => (
            <Field className="sm:col-span-3">
              <FieldLabel>Title</FieldLabel>
              <Input
                autoFocus
                maxLength={256}
                minLength={1}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="What's new?"
                required
                type="text"
                value={field.state.value}
              />
            </Field>
          )}
        </form.Field>

        {/* Version */}
        <form.Field name="version">
          {(field) => (
            <Field className="sm:col-span-1">
              <FieldLabel>Version</FieldLabel>
              <Input
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="e.g. 1.0.0"
                type="text"
                value={field.state.value}
              />
            </Field>
          )}
        </form.Field>
      </div>

      {/* Tags */}
      <form.Field name="tags">
        {(field) => (
          <Field>
            <FieldLabel>Tags</FieldLabel>
            <ChangelogTagSelector
              onChange={field.handleChange}
              value={field.state.value}
            />
          </Field>
        )}
      </form.Field>

      {/* Description */}
      <form.Field name="description">
        {(field) => (
          <Field>
            <FieldLabel>Description</FieldLabel>
            <Textarea
              className="min-h-[300px] resize-y font-mono text-sm leading-relaxed"
              maxLength={10_000}
              minLength={1}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Write about the changes... (Markdown supported)"
              required
              value={field.state.value}
            />
          </Field>
        )}
      </form.Field>

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Cover Image URL */}
        <form.Field name="coverImageUrl">
          {(field) => (
            <Field>
              <FieldLabel>Cover Image</FieldLabel>
              <Input
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
                placeholder="https://..."
                type="url"
                value={field.state.value}
              />
              <FieldDescription>Optional image URL</FieldDescription>
            </Field>
          )}
        </form.Field>

        {/* Linked Feedback */}
        <form.Field name="feedbackPostIds">
          {(field) => (
            <Field>
              <FieldLabel>Related Feedback</FieldLabel>
              <FeedbackSelector
                onValueChange={field.handleChange}
                organizationId={organizationId}
                value={field.state.value as string[]}
              />
              <FieldDescription>Link completed feedback</FieldDescription>
            </Field>
          )}
        </form.Field>
      </div>
    </FieldGroup>
  );
}
