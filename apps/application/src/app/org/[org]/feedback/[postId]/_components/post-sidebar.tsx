"use client";

import {
  Copy01Icon,
  Delete01Icon,
  SquareArrowUpRight02Icon,
} from "@hugeicons-pro/core-bulk-rounded";
import { useMutation } from "@tanstack/react-query";
import type { FeedbackCategory, FeedbackStatus } from "@userbubble/db/schema";
import { cn } from "@userbubble/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@userbubble/ui/avatar";
import { Button } from "@userbubble/ui/button";
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPopup,
  DialogTitle,
} from "@userbubble/ui/dialog";
import {
  DoubleCard,
  DoubleCardHeader,
  DoubleCardInner,
} from "@userbubble/ui/double-card";
import { Icon } from "@userbubble/ui/icon";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { getCategory, getStatus } from "~/components/feedback/config";
import { useTRPC } from "~/trpc/react";
import { CategoryEditor } from "./category-editor";
import { StatusEditor } from "./status-editor";

type PostSidebarProps = {
  postId: string;
  org: string;
  status: FeedbackStatus;
  category: FeedbackCategory;
  author: { name: string | null; image: string | null } | null;
  createdAt: Date;
  isAdmin: boolean;
  canModify: boolean;
};

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) {
    return "just now";
  }
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days}d ago`;
  }
  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months}mo ago`;
  }
  return `${Math.floor(months / 12)}y ago`;
}

export function PostSidebar({
  postId,
  org,
  status,
  category,
  author,
  createdAt,
  isAdmin,
  canModify,
}: PostSidebarProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();
  const trpc = useTRPC();

  const deletePost = useMutation(
    trpc.feedback.delete.mutationOptions({
      onSuccess: async () => {
        toast.success("Post deleted");
        router.push(`/org/${org}/feedback`);
      },
      onError: () => {
        toast.error("Failed to delete post");
        setIsDeleting(false);
        setDeleteDialogOpen(false);
      },
    })
  );

  const getExternalUrl = () => {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? window.location.origin;
    const parsed = new URL(appUrl);
    const hostParts = parsed.host.split(".");
    hostParts[0] = org;
    return `${parsed.protocol}//${hostParts.join(".")}/feedback/${postId}`;
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getExternalUrl());
    toast.success("Link copied");
  };

  const handleOpenExternal = () => {
    window.open(getExternalUrl(), "_blank", "noopener");
  };

  const statusConfig = getStatus(status);
  const categoryConfig = getCategory(category);

  return (
    <div className="sticky top-8">
      <DoubleCard>
        {/* Action buttons — outside DoubleCardInner */}
        {canModify && (
          <DoubleCardHeader className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button
                className="size-8 text-muted-foreground"
                onClick={handleOpenExternal}
                size="icon"
                variant="ghost"
              >
                <Icon icon={SquareArrowUpRight02Icon} size={16} />
                <span className="sr-only">Open external</span>
              </Button>
              <Button
                className="size-8 text-muted-foreground"
                onClick={handleCopyLink}
                size="icon"
                variant="ghost"
              >
                <Icon icon={Copy01Icon} size={16} />
                <span className="sr-only">Copy link</span>
              </Button>
            </div>
            <Button
              className="size-8 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              onClick={() => setDeleteDialogOpen(true)}
              size="icon"
              variant="ghost"
            >
              <Icon icon={Delete01Icon} size={16} />
              <span className="sr-only">Delete</span>
            </Button>
          </DoubleCardHeader>
        )}

        <DoubleCardInner>
          {/* Author */}
          <div className="border-b px-4 py-4">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={author?.image ?? undefined} />
                <AvatarFallback>
                  {author?.name?.[0]?.toUpperCase() ?? "A"}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="font-medium text-sm">
                  {author?.name ?? "Anonymous"}
                </span>
                <span className="text-muted-foreground text-xs">
                  {timeAgo(createdAt)}
                </span>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3 px-4 py-4">
            {/* Board (Category) */}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Board</span>
              {isAdmin ? (
                <CategoryEditor currentCategory={category} postId={postId} />
              ) : (
                categoryConfig && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 font-medium text-xs",
                      categoryConfig.color
                        .replace("text-", "bg-")
                        .replace("-500", "-500/15"),
                      categoryConfig.color
                    )}
                  >
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        categoryConfig.color.replace("text-", "bg-")
                      )}
                    />
                    {categoryConfig.label}
                  </span>
                )
              )}
            </div>

            {/* Status */}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Status</span>
              {isAdmin ? (
                <StatusEditor currentStatus={status} postId={postId} />
              ) : (
                statusConfig && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 font-medium text-xs",
                      statusConfig.color
                        .replace("text-", "bg-")
                        .replace("-500", "-500/15")
                        .replace("-400", "-400/15"),
                      statusConfig.color
                    )}
                  >
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        statusConfig.color.replace("text-", "bg-")
                      )}
                    />
                    {statusConfig.label}
                  </span>
                )
              )}
            </div>

            {/* Source */}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Source</span>
              <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-0.5 font-medium text-muted-foreground text-xs">
                <span className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                Dashboard
              </span>
            </div>
          </div>
        </DoubleCardInner>
      </DoubleCard>

      {/* Delete dialog */}
      <Dialog onOpenChange={setDeleteDialogOpen} open={deleteDialogOpen}>
        <DialogPopup className="pt-4 sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Delete Post</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this post? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              disabled={isDeleting}
              onClick={() => {
                setIsDeleting(true);
                deletePost.mutate({ id: postId });
              }}
              variant="destructive"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogPopup>
      </Dialog>
    </div>
  );
}
