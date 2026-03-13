import {
  canModifyPostSync,
  getFeedbackPost,
  getPostComments,
  getUserVote,
  memberQueries,
  permissions,
} from "@userbubble/db/queries";
import { notFound } from "next/navigation";
import { getSession } from "~/auth/server";
import { getOrganization } from "~/lib/get-organization";
import { BackButton } from "./_components/back-button";
import { CommentsSection } from "./_components/comments-section";
import { PostActionBar } from "./_components/post-action-bar";
import { PostMainContent } from "./_components/post-main-content";
import { PostSidebar } from "./_components/post-sidebar";

type FeedbackPostPageProps = {
  params: Promise<{ org: string; postId: string }>;
};

export default async function FeedbackPostPage({
  params,
}: FeedbackPostPageProps) {
  const { org, postId } = await params;

  const organization = await getOrganization(org);

  const post = await getFeedbackPost(postId);
  if (!post) {
    notFound();
  }

  if (post.post.organizationId !== organization.id) {
    notFound();
  }

  const [comments, session] = await Promise.all([
    getPostComments(postId, organization.id),
    getSession(),
  ]);

  const userId = session?.user?.id;

  // Resolve member once for permission checks
  const member = userId
    ? await memberQueries.findByUserAndOrg(userId, organization.id)
    : null;

  const role = member?.role ?? null;
  const isAdmin = role ? permissions.isAdmin(role) : false;
  const canModify =
    userId && role
      ? canModifyPostSync({ userId, role }, { authorId: post.post.authorId })
      : false;

  const hasUserVoted = userId ? !!(await getUserVote(postId, userId)) : false;

  return (
    <div className="mx-auto max-w-6xl">
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
        <div className="lg:col-span-4">
          <PostSidebar
            author={post.author}
            canModify={canModify}
            category={post.post.category}
            createdAt={post.post.createdAt}
            isAdmin={isAdmin}
            org={org}
            postId={postId}
            status={post.post.status}
          />
        </div>
      </div>

      {/* Floating bottom action bar (admin only) */}
      {isAdmin && (
        <PostActionBar currentStatus={post.post.status} postId={postId} />
      )}
    </div>
  );
}
