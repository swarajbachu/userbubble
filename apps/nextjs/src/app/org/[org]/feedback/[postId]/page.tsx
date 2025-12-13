import {
  canModifyPost,
  getFeedbackPost,
  getPostComments,
  getUserVote,
  memberQueries,
} from "@critichut/db/queries";
import { Avatar, AvatarFallback, AvatarImage } from "@critichut/ui/avatar";
import {
  DoubleCard,
  DoubleCardHeader,
  DoubleCardInner,
} from "@critichut/ui/double-card";
import { Icon } from "@critichut/ui/icon";
import { notFound } from "next/navigation";
import { getSession } from "~/auth/server";
import { categoryLabels, statusConfig } from "~/components/feedback/config";
import { getOrganization } from "~/lib/get-organization";
import { BackButton } from "./_components/back-button";
import { CategoryEditor } from "./_components/category-editor";
import { CommentsSection } from "./_components/comments-section";
import { PostActions } from "./_components/post-actions";
import { PostMainContent } from "./_components/post-main-content";
import { StatusEditor } from "./_components/status-editor";

type FeedbackPostPageProps = {
  params: Promise<{ org: string; postId: string }>;
};

export default async function FeedbackPostPage({
  params,
}: FeedbackPostPageProps) {
  const { org, postId } = await params;

  // Fetch organization (cached from layout)
  const organization = await getOrganization(org);

  // Fetch post data
  const post = await getFeedbackPost(postId);
  if (!post) {
    notFound();
  }

  // Verify post belongs to this organization
  if (post.post.organizationId !== organization.id) {
    notFound();
  }

  // Fetch comments
  const comments = await getPostComments(postId);

  // Get session and check permissions
  const session = await getSession();
  const userId = session?.user?.id;

  // Check permissions
  const canModify = userId ? await canModifyPost(userId, postId) : false;
  const isAdmin = userId
    ? await memberQueries.hasRole(userId, organization.id, ["admin", "owner"])
    : false;

  // Check if user voted
  const hasUserVoted = userId ? !!(await getUserVote(postId, userId)) : false;

  const config = statusConfig[post.post.status];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <BackButton org={org} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-12">
        {/* Main Content - Left Column */}
        <div className="space-y-8 lg:col-span-8">
          <PostMainContent
            canModify={canModify}
            hasUserVoted={hasUserVoted}
            initialDescription={post.post.description}
            initialTitle={post.post.title}
            initialVoteCount={post.post.voteCount}
            isAuthenticated={!!userId}
            postId={postId}
          />

          <CommentsSection
            initialComments={comments}
            isAuthenticated={!!userId}
            organizationId={organization.id}
            postId={postId}
            userId={userId}
          />
        </div>

        {/* Sidebar - Right Column */}
        <div className="space-y-6 lg:col-span-4">
          <div className="sticky top-8 space-y-6">
            <DoubleCard>
              <DoubleCardHeader className="py-1">
                <span className="font-semibold text-sm">Author</span>
              </DoubleCardHeader>
              <DoubleCardInner className="p-4">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={post.author?.image ?? undefined} />
                    <AvatarFallback>
                      {post.author?.name?.[0]?.toUpperCase() ?? "A"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">
                      {post.author?.name ?? "Anonymous"}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {post.post.createdAt.toLocaleDateString(undefined, {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </DoubleCardInner>
            </DoubleCard>

            <DoubleCard>
              <DoubleCardHeader className="flex items-center justify-between">
                <span className="font-semibold text-sm">Details</span>
                {canModify && <PostActions org={org} postId={postId} />}
              </DoubleCardHeader>

              <DoubleCardInner className="space-y-4 p-4">
                {/* Status */}
                <div className="space-y-2">
                  <span className="mb-2 block font-medium text-muted-foreground text-xs uppercase tracking-wider">
                    Status
                  </span>
                  <div className="mt-2">
                    {isAdmin ? (
                      <StatusEditor
                        currentStatus={post.post.status}
                        postId={postId}
                      />
                    ) : (
                      <div className="flex items-center gap-2 font-medium text-sm">
                        <Icon
                          className={config.color}
                          icon={config.icon}
                          size={16}
                        />
                        <span className="capitalize">
                          {post.post.status.replace("_", " ")}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <span className="mb-2 block font-medium text-muted-foreground text-xs uppercase tracking-wider">
                    Category
                  </span>
                  <div className="mt-2">
                    {isAdmin ? (
                      <CategoryEditor
                        currentCategory={post.post.category}
                        postId={postId}
                      />
                    ) : (
                      <div className="font-medium text-sm">
                        {categoryLabels[post.post.category]}
                      </div>
                    )}
                  </div>
                </div>
              </DoubleCardInner>
            </DoubleCard>
          </div>
        </div>
      </div>
    </div>
  );
}
