"use client";

import { cn } from "@critichut/ui";
import { Button } from "@critichut/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@critichut/ui/dialog";
import { Input } from "@critichut/ui/input";
import { useForm } from "@tanstack/react-form";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { toast } from "sonner";
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

type EditPostDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
};

export function EditPostDialog({
  open,
  onOpenChange,
  postId,
}: EditPostDialogProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  // Fetch current post data
  const { data: post } = useSuspenseQuery(
    trpc.feedback.getById.queryOptions({ id: postId })
  );

  const updatePost = useMutation(
    trpc.feedback.update.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: trpc.feedback.getById.queryKey({ id: postId }),
        });
        toast.success("Post updated successfully!");
        onOpenChange(false);
      },
      onError: () => {
        toast.error("Failed to update post");
      },
    })
  );

  const form = useForm({
    defaultValues: {
      title: post.post.title,
      description: post.post.description,
    },
    onSubmit: async ({ value }) => {
      await updatePost.mutateAsync({
        id: postId,
        ...value,
      });
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
            <DialogHeader>
              <DialogTitle>Edit Post</DialogTitle>
              <DialogDescription>
                Make changes to your feedback post.
              </DialogDescription>
            </DialogHeader>

            {/* Title */}
            <form.Field name="title">
              {(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <div className="flex flex-col gap-2">
                    <label className="font-medium text-sm" htmlFor={field.name}>
                      Title
                    </label>
                    <Input
                      className={cn(isInvalid && "border-destructive")}
                      id={field.name}
                      maxLength={256}
                      minLength={3}
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Post title"
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
                    <label className="font-medium text-sm" htmlFor={field.name}>
                      Description
                    </label>
                    <Textarea
                      className={cn(
                        "min-h-[150px] resize-none",
                        isInvalid && "border-destructive"
                      )}
                      id={field.name}
                      maxLength={5000}
                      minLength={10}
                      name={field.name}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder="Post description"
                      required
                      rows={8}
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
          </DialogBody>

          <DialogFooter>
            <Button
              disabled={updatePost.isPending}
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              Cancel
            </Button>
            <Button disabled={updatePost.isPending} type="submit">
              {updatePost.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
