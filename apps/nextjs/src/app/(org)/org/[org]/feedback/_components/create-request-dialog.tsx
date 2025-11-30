"use client";

import type { AppRouter } from "@critichut/api";
import { createFeedbackValidator } from "@critichut/db/schema";
import { Button } from "@critichut/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@critichut/ui/dialog";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@critichut/ui/field";
import { Input } from "@critichut/ui/input";
import { toast } from "@critichut/ui/toast";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TRPCClientErrorLike } from "@trpc/client";

import { useTRPC } from "~/trpc/react";

type CreateRequestDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
};

export function CreateRequestDialog({
  open,
  onOpenChange,
  organizationId,
}: CreateRequestDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const createPost = useMutation(
    trpc.feedback.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.feedback.pathFilter());
        toast.success("Request submitted successfully!");
        onOpenChange(false);
      },
      onError: (err: TRPCClientErrorLike<AppRouter>) => {
        toast.error(
          err.data?.code === "UNAUTHORIZED"
            ? "You must be logged in to submit a request"
            : "Failed to create request"
        );
      },
    })
  );

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
      await createPost.mutateAsync(value);
      form.reset();
    },
  });

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Request</DialogTitle>
          <DialogDescription>
            Share your ideas, report bugs, or suggest improvements. Your
            feedback helps us build better products.
          </DialogDescription>
        </DialogHeader>

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
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                    placeholder="Brief summary of your request"
                    required
                    type="text"
                    value={field.state.value}
                  />
                  <div className="mt-1 text-muted-foreground text-xs">
                    {field.state.value.length}/256 characters
                  </div>
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
                    className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    id={field.name}
                    maxLength={5000}
                    minLength={10}
                    name={field.name}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    placeholder="Provide more details about your request..."
                    required
                    rows={6}
                    value={field.state.value}
                  />
                  <div className="mt-1 text-muted-foreground text-xs">
                    {field.state.value.length}/5000 characters
                  </div>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          </form.Field>

          <DialogFooter>
            <Button
              disabled={createPost.isPending}
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={createPost.isPending} type="submit">
              {createPost.isPending ? "Submitting..." : "Submit Request"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
