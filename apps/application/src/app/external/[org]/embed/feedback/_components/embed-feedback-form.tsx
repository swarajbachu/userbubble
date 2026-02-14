"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TRPCClientErrorLike } from "@trpc/client";
import type { AppRouter } from "@userbubble/api";
import { createFeedbackValidator } from "@userbubble/db/schema";
import { cn } from "@userbubble/ui";
import { Button } from "@userbubble/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@userbubble/ui/select";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";

type EmbedFeedbackFormProps = {
  organizationId: string;
};

export function EmbedFeedbackForm({ organizationId }: EmbedFeedbackFormProps) {
  const [expanded, setExpanded] = useState(false);
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const createPost = useMutation(
    trpc.feedback.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.feedback.pathFilter());
        toast.success("Feedback submitted!");
        setExpanded(false);
        form.reset();
      },
      onError: (err: TRPCClientErrorLike<AppRouter>) => {
        if (err.data?.code === "FORBIDDEN") {
          toast.error(err.message);
        } else {
          toast.error("Failed to submit feedback");
        }
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

  if (!expanded) {
    return (
      <button
        className="w-full rounded-xl border border-dashed p-3 text-left text-muted-foreground text-sm transition-colors hover:border-foreground/20 hover:bg-secondary/50"
        onClick={() => setExpanded(true)}
        type="button"
      >
        What's on your mind?
      </button>
    );
  }

  return (
    <form
      className="rounded-xl border p-3"
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
    >
      <form.Field name="title">
        {(field) => (
          <input
            autoFocus
            className="w-full bg-transparent font-medium text-sm placeholder:text-muted-foreground/60 focus:outline-none"
            maxLength={256}
            minLength={3}
            name={field.name}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value)}
            placeholder="Title"
            required
            type="text"
            value={field.state.value}
          />
        )}
      </form.Field>

      <form.Field name="description">
        {(field) => (
          <textarea
            className={cn(
              "mt-2 w-full resize-none bg-transparent text-sm placeholder:text-muted-foreground/60 focus:outline-none"
            )}
            maxLength={5000}
            minLength={10}
            name={field.name}
            onBlur={field.handleBlur}
            onChange={(e) => field.handleChange(e.target.value)}
            placeholder="Describe your feedback..."
            required
            rows={3}
            value={field.state.value}
          />
        )}
      </form.Field>

      <div className="mt-2 flex items-center justify-between">
        <form.Field name="category">
          {(field) => (
            <Select
              onValueChange={(value) =>
                field.handleChange(value as typeof field.state.value)
              }
              value={field.state.value}
            >
              <SelectTrigger className="h-7 w-auto gap-1.5 border-none bg-secondary/50 px-2.5 text-xs shadow-none hover:bg-secondary focus:ring-0">
                <SelectValue>
                  <span className="capitalize">
                    {field.state.value.replace("_", " ")}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="feature_request">Feature Request</SelectItem>
                <SelectItem value="bug">Bug Report</SelectItem>
                <SelectItem value="improvement">Improvement</SelectItem>
                <SelectItem value="question">Question</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          )}
        </form.Field>

        <div className="flex gap-2">
          <Button
            onClick={() => {
              setExpanded(false);
              form.reset();
            }}
            size="sm"
            type="button"
            variant="ghost"
          >
            Cancel
          </Button>
          <Button disabled={createPost.isPending} size="sm" type="submit">
            {createPost.isPending ? "..." : "Submit"}
          </Button>
        </div>
      </div>
    </form>
  );
}
