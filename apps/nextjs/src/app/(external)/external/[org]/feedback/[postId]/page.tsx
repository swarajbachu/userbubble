import {
  getFeedbackPost,
  getPostComments,
  getUserVote,
} from "@critichut/db/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@critichut/ui/card";
import { Icon } from "@critichut/ui/icon";
import { notFound } from "next/navigation";
import { CommentsSection } from "~/app/(org)/org/[org]/feedback/[postId]/_components/comments-section";
import { PostMainContent } from "~/app/(org)/org/[org]/feedback/[postId]/_components/post-main-content";
import { getSession } from "~/auth/server";
import { categoryLabels, statusConfig } from "~/components/feedback/config";
import { getOrganization } from "~/lib/get-organization";

type ExternalFeedbackPostPageProps = {
  params: Promise<{ org: string; postId: string }>;
};

export default async function ExternalFeedbackPostPage({
  params,
}: ExternalFeedbackPostPageProps) {
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

  // Get session - external users might be anonymous
  const session = await getSession();
  const userId = session?.user?.id;

  // Check if user voted
  const hasUserVoted = userId ? !!(await getUserVote(postId, userId)) : false;

  const config = statusConfig[post.post.status];

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Main Content - Left Column */}
        <div className="space-y-8 lg:col-span-8">
          <PostMainContent
            authorName={post.author?.name ?? "Anonymous"}
            canModify={false}
            createdAt={post.post.createdAt}
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
          <div className="sticky top-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Details</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Status */}
                <div className="space-y-2">
                  <span className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
                    Status
                  </span>
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
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <span className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
                    Category
                  </span>
                  <div className="font-medium text-sm">
                    {categoryLabels[post.post.category]}
                  </div>
                </div>

                {/* Vote Count */}
                <div className="space-y-2">
                  <span className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
                    Votes
                  </span>
                  <div className="font-medium text-sm">
                    {post.post.voteCount}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
