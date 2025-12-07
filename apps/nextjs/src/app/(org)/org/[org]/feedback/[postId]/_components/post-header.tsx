import type { FeedbackPost } from "@critichut/db/schema";
import { Icon } from "@critichut/ui/icon";
import { categoryLabels, statusConfig } from "../../config";
import { CategoryEditor } from "./category-editor";
import { PostActions } from "./post-actions";
import { StatusEditor } from "./status-editor";

type PostHeaderProps = {
  post: FeedbackPost;
  author: { name: string | null; image: string | null } | null;
  canModify: boolean;
  isAdmin: boolean;
  org: string;
};

export function PostHeader({
  post,
  author,
  canModify,
  isAdmin,
  org,
}: PostHeaderProps) {
  const config = statusConfig[post.status];

  return (
    <div className="space-y-4">
      <h1 className="font-bold text-3xl">{post.title}</h1>

      <div className="flex flex-wrap items-center gap-4 text-sm">
        {/* Status badge (editable for admins) */}
        {isAdmin ? (
          <StatusEditor currentStatus={post.status} postId={post.id} />
        ) : (
          <div className="flex items-center gap-2">
            <Icon className={config.color} icon={config.icon} size={16} />
            <span className="capitalize">{post.status.replace("_", " ")}</span>
          </div>
        )}

        {/* Category badge (editable for admins) */}
        {isAdmin ? (
          <CategoryEditor currentCategory={post.category} postId={post.id} />
        ) : (
          <span className="text-muted-foreground">
            {categoryLabels[post.category]}
          </span>
        )}

        {/* Author info */}
        <div className="flex items-center gap-2">
          <div className="size-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/10" />
          <span className="text-muted-foreground">
            {author?.name ?? "Anonymous"}
          </span>
        </div>

        {/* Date */}
        <span className="text-muted-foreground">
          {new Date(post.createdAt).toLocaleDateString(undefined, {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </span>
      </div>

      {/* Action buttons (edit/delete) */}
      {canModify && <PostActions org={org} postId={post.id} />}
    </div>
  );
}
