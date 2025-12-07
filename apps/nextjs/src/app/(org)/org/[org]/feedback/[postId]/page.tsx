import {
  canModifyPost,
  getFeedbackPost,
  getPostComments,
  getUserVote,
  memberQueries,
} from "@critichut/db/queries";
import { notFound } from "next/navigation";
import { getSession } from "~/auth/server";
import { getOrganization } from "~/lib/get-organization";
import { BackButton } from "./_components/back-button";
import { CommentsSection } from "./_components/comments-section";
import { PostContent } from "./_components/post-content";
import { PostHeader } from "./_components/post-header";
import { VoteSection } from "./_components/vote-section";

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

  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6">
      <BackButton org={org} />

      <PostHeader
        author={post.author}
        canModify={canModify}
        isAdmin={isAdmin}
        org={org}
        post={post.post}
      />

      <div className="mt-6">
        <VoteSection
          hasUserVoted={hasUserVoted}
          initialVoteCount={post.post.voteCount}
          isAuthenticated={!!userId}
          postId={postId}
        />
      </div>

      <PostContent description={post.post.description} />

      <CommentsSection
        initialComments={comments}
        isAuthenticated={!!userId}
        organizationId={organization.id}
        postId={postId}
        userId={userId}
      />
    </div>
  );
}
