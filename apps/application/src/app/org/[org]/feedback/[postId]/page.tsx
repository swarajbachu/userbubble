import { notFound } from "next/navigation";
import { getSession } from "~/auth/server";
import { getFeedbackThread } from "~/lib/get-feedback-thread";
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

  const thread = await getFeedbackThread(organization.id, postId);
  if (!thread) {
    notFound();
  }
  const { post, comments, isAdmin, canModify, hasUserVoted } = thread;
  const session = await getSession();
  const userId = session?.user?.id;

  return (
    <div className="mx-auto max-w-screen-2xl">
      <div className="mb-4">
        <BackButton org={org} />
      </div>

      <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Main Content - Left Column */}
        <div className="space-y-5 lg:col-span-8">
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
            initialComments={[...comments]}
            isAuthenticated={!!userId}
            organizationId={organization.id}
            postId={postId}
            userId={userId}
          />
        </div>

        {/* Sidebar - Right Column */}
        <div className="space-y-6 lg:col-span-4">
          <PostSidebar
            author={post.author}
            canModify={canModify}
            category={post.post.category}
            createdAt={post.post.createdAt}
            isAdmin={isAdmin}
            org={org}
            organizationId={organization.id}
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
