"use client";

import type { AppRouter } from "@critichut/api";
import { createFeedbackValidator } from "@critichut/db/schema";
import { Button } from "@critichut/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@critichut/ui/field";
import { Input } from "@critichut/ui/input";
import { toast } from "@critichut/ui/toast";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import type { TRPCClientErrorLike } from "@trpc/client";
import { X } from "lucide-react";

import { useTRPC } from "~/trpc/react";

type NewPostModalProps = {
  isOpen: boolean;
  onClose: () => void;
  organizationId: string;
};

export function NewPostModal({
  isOpen,
  onClose,
  organizationId,
}: NewPostModalProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const form = useForm({
    defaultValues: {
      organizationId,
      title: "",
      description: "",
      category: "feature_request" as
        | "feature_request"
        | "bug"
        | "improvement"
        | "question"
        | "other",
    },
    validators: {
      onSubmit: createFeedbackValidator,
    },
    onSubmit: async ({ value }) => {
      try {
        await trpc.feedback.create.mutate(value);
        form.reset();
        onClose();
        await queryClient.invalidateQueries(trpc.feedback.pathFilter());
        toast.success("Feedback submitted successfully!");
      } catch (err) {
        const error = err as TRPCClientErrorLike<AppRouter>;
        toast.error(
          error.data?.code === "UNAUTHORIZED"
            ? "You must be logged in to submit feedback"
            : "Failed to create feedback post"
        );
      }
    },
  });

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
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          {/* Category */}
          <form.Field name="category">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldContent>
                    <FieldLabel htmlFor={field.name}>Category</FieldLabel>
                  </FieldContent>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:font-medium file:text-sm placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    id={field.name}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) =>
                      field.handleChange(
                        e.target.value as typeof field.state.value
                      )
                    }
                    required
                    value={field.state.value}
                  >
                    <option value="feature_request">Feature Request</option>
                    <option value="bug">Bug Report</option>
                    <option value="improvement">Improvement</option>
                    <option value="question">Question</option>
                    <option value="other">Other</option>
                  </select>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          {/* Title */}
          <form.Field name="title">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldContent>
                    <FieldLabel htmlFor={field.name}>Title</FieldLabel>
                  </FieldContent>
                  <Input
                    id={field.name}
                    maxLength={256}
                    minLength={3}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Brief summary of your feedback"
                    required
                    type="text"
                    value={field.state.value}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          {/* Description */}
          <form.Field name="description">
            {(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldContent>
                    <FieldLabel htmlFor={field.name}>Description</FieldLabel>
                  </FieldContent>
                  <textarea
                    className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    id={field.name}
                    maxLength={5000}
                    minLength={10}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Provide more details about your feedback..."
                    required
                    rows={6}
                    value={field.state.value}
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button
              disabled={form.state.isSubmitting}
              onClick={onClose}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={form.state.isSubmitting} type="submit">
              {form.state.isSubmitting ? "Submitting..." : "Submit Feedback"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
