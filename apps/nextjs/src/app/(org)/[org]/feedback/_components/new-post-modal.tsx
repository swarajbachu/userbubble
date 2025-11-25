"use client";

import { Button } from "@critichut/ui/button";
import { Field, FieldError } from "@critichut/ui/field";
import { Input } from "@critichut/ui/input";
import { Label } from "@critichut/ui/label";
import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { trpc } from "~/trpc/react";

type NewPostModalProps = {
  org: string;
  isOpen: boolean;
  onClose: () => void;
};

export function NewPostModal({ org, isOpen, onClose }: NewPostModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<
    "feature_request" | "bug" | "improvement" | "question" | "other"
  >("feature_request");

  const { data: orgData } = trpc.organization.getBySlug.useQuery({
    slug: org,
  });

  const createMutation = trpc.feedback.create.useMutation({
    onSuccess: () => {
      // Reset form
      setTitle("");
      setDescription("");
      setCategory("feature_request");
      onClose();
      // Refresh the page to show new post
      router.refresh();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!orgData?.id) {
      return;
    }

    createMutation.mutate({
      organizationId: orgData.id,
      title,
      description,
      category,
    });
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-2xl rounded-lg bg-background p-6 shadow-lg">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-semibold text-2xl">Share Your Feedback</h2>
          <Button
            className="h-8 w-8 p-0"
            onClick={onClose}
            size="sm"
            variant="ghost"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Category */}
          <Field>
            <Label htmlFor="category">Category</Label>
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              id="category"
              onChange={(e) =>
                setCategory(
                  e.target.value as
                    | "feature_request"
                    | "bug"
                    | "improvement"
                    | "question"
                    | "other"
                )
              }
              required
              value={category}
            >
              <option value="feature_request">Feature Request</option>
              <option value="bug">Bug Report</option>
              <option value="improvement">Improvement</option>
              <option value="question">Question</option>
              <option value="other">Other</option>
            </select>
          </Field>

          {/* Title */}
          <Field>
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              maxLength={256}
              minLength={3}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of your feedback"
              required
              type="text"
              value={title}
            />
            {createMutation.error?.data?.zodError?.fieldErrors.title && (
              <FieldError>
                {createMutation.error.data.zodError.fieldErrors.title[0]}
              </FieldError>
            )}
          </Field>

          {/* Description */}
          <Field>
            <Label htmlFor="description">Description</Label>
            <textarea
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              id="description"
              maxLength={5000}
              minLength={10}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide more details about your feedback..."
              required
              rows={6}
              value={description}
            />
            {createMutation.error?.data?.zodError?.fieldErrors.description && (
              <FieldError>
                {createMutation.error.data.zodError.fieldErrors.description[0]}
              </FieldError>
            )}
          </Field>

          {/* Error message */}
          {createMutation.error && !createMutation.error.data?.zodError && (
            <div className="rounded-md bg-destructive/10 p-3 text-destructive text-sm">
              {createMutation.error.message}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              disabled={createMutation.isPending}
              onClick={onClose}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={createMutation.isPending} type="submit">
              {createMutation.isPending ? "Submitting..." : "Submit Feedback"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
