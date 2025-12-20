"use client";

import { useForm } from "@tanstack/react-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TRPCClientErrorLike } from "@trpc/client";
import type { AppRouter } from "@userbubble/api";
import { createFeedbackValidator } from "@userbubble/db/schema";
import { cn } from "@userbubble/ui";
import { Button } from "@userbubble/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@userbubble/ui/dialog";
import { Icon } from "@userbubble/ui/icon";
import { Input } from "@userbubble/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@userbubble/ui/select";
import { toast } from "@userbubble/ui/toast";
import { categoryConfig } from "~/components/feedback/config";
import { useTRPC } from "~/trpc/react";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs outline-none transition-[color,box-shadow] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm dark:bg-input/30",
        "aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  );
}

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
        <form
          className="contents"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <DialogBody className="space-y-4">
            <DialogHeader className="sr-only">
              <DialogTitle className="sr-only">Create Request</DialogTitle>
              <DialogDescription className="sr-only">
                Share your ideas, report bugs, or suggest improvements. Your
                feedback helps us build better products.
              </DialogDescription>
            </DialogHeader>
            {/* Title */}

            <form.Field name="title">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <div className="flex flex-col gap-2">
                    <Input
                      className={cn(
                        "h-auto rounded-none border-none bg-transparent p-0 font-semibold text-lg shadow-none placeholder:text-muted-foreground/50 focus-visible:ring-0 dark:bg-transparent",
                        isInvalid &&
                          "text-destructive placeholder:text-destructive"
                      )}
                      id={field.name}
                      maxLength={256}
                      minLength={3}
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Request Title"
                      required
                      type="text"
                      value={field.state.value}
                    />
                    {isInvalid && (
                      <span className="text-destructive text-xs">
                        {field.state.meta.errors.join(", ")}
                      </span>
                    )}
                  </div>
                );
              }}
            </form.Field>

            {/* Description */}
            <form.Field name="description">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <div className="flex flex-col gap-2">
                    <Textarea
                      className={cn(
                        "min-h-[100px] resize-none rounded-none border-none bg-transparent p-0 shadow-none placeholder:text-muted-foreground/50 focus-visible:ring-0 dark:bg-transparent",
                        isInvalid &&
                          "text-destructive placeholder:text-destructive"
                      )}
                      id={field.name}
                      maxLength={5000}
                      minLength={10}
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Add details..."
                      required
                      rows={6}
                      value={field.state.value}
                    />
                    {isInvalid && (
                      <span className="text-destructive text-xs">
                        {field.state.meta.errors.join(", ")}
                      </span>
                    )}
                  </div>
                );
              }}
            </form.Field>

            {/* Category */}
            <form.Field name="category">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <div className="flex items-center gap-2 pt-2">
                    <Select
                      onValueChange={(value) =>
                        field.handleChange(value as typeof field.state.value)
                      }
                      value={field.state.value}
                    >
                      <SelectTrigger className="h-8 w-auto gap-2 border-none bg-secondary/50 px-3 font-medium text-xs shadow-none hover:bg-secondary focus:ring-0">
                        <SelectValue>
                          <div className="flex items-center gap-2">
                            <Icon
                              icon={categoryConfig[field.state.value].icon}
                              size={16}
                            />
                            <span className="capitalize">
                              {field.state.value.replace("_", " ")}
                            </span>
                          </div>
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
                    {isInvalid && (
                      <span className="text-destructive text-xs">
                        {field.state.meta.errors.join(", ")}
                      </span>
                    )}
                  </div>
                );
              }}
            </form.Field>
          </DialogBody>
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
