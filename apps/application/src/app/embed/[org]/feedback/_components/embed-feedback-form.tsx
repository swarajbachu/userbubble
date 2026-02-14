"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TRPCClientErrorLike } from "@trpc/client";
import type { AppRouter } from "@userbubble/api";
import { createFeedbackValidator } from "@userbubble/db/schema";
import { Button } from "@userbubble/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@userbubble/ui/select";
import { toast } from "sonner";
import { useTRPC } from "~/trpc/react";

type EmbedFeedbackFormProps = {
  organizationId: string;
};

export function EmbedFeedbackForm({ organizationId }: EmbedFeedbackFormProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const createPost = useMutation(
    trpc.feedback.create.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.feedback.pathFilter());
        toast.success("Thanks for your feedback!");
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

  return (
    <div className="flex h-full flex-col p-4">
      <div className="mb-4">
        <h2 className="font-semibold text-base">Share feedback</h2>
        <p className="mt-0.5 text-muted-foreground text-xs">
          We'd love to hear your thoughts
        </p>
      </div>

      <form
        className="flex flex-1 flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.Field name="title">
          {(field) => (
            <input
              className="w-full rounded-lg border bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
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
              className="w-full flex-1 resize-none rounded-lg border bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring"
              maxLength={5000}
              minLength={10}
              name={field.name}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              placeholder="Tell us more..."
              required
              rows={4}
              value={field.state.value}
            />
          )}
        </form.Field>

        <div className="flex items-center justify-between">
          <form.Field name="category">
            {(field) => (
              <Select
                onValueChange={(value) =>
                  field.handleChange(value as typeof field.state.value)
                }
                value={field.state.value}
              >
                <SelectTrigger className="h-8 w-auto gap-1.5 border-none bg-secondary/60 px-2.5 text-xs shadow-none hover:bg-secondary">
                  <SelectValue>
                    <span className="capitalize">
                      {field.state.value.replace("_", " ")}
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="feature_request">
                    Feature Request
                  </SelectItem>
                  <SelectItem value="bug">Bug Report</SelectItem>
                  <SelectItem value="improvement">Improvement</SelectItem>
                  <SelectItem value="question">Question</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            )}
          </form.Field>

          <Button disabled={createPost.isPending} size="sm" type="submit">
            {createPost.isPending ? "Sending..." : "Submit"}
          </Button>
        </div>
      </form>
    </div>
  );
}
