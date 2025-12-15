import {
  getFeedbackPost,
  getPostComments,
  getUserVote,
} from "@critichut/db/queries";
import { Avatar, AvatarFallback, AvatarImage } from "@critichut/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@critichut/ui/card";
import { Icon } from "@critichut/ui/icon";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CommentsSection } from "~/app/org/[org]/feedback/[postId]/_components/comments-section";
import { PostMainContent } from "~/app/org/[org]/feedback/[postId]/_components/post-main-content";
import { getSession } from "~/auth/server";
import { categoryLabels, statusConfig } from "~/components/feedback/config";
import { getOrganization } from "~/lib/get-organization";

type ExternalFeedbackPostPageProps = {
  params: Promise<{ org: string; postId: string }>;
};

export async function generateMetadata({
  params,
}: ExternalFeedbackPostPageProps): Promise<Metadata> {
  const { org, postId } = await params;
  const organization = await getOrganization(org);
  const post = await getFeedbackPost(postId);

  if (!post || post.post.organizationId !== organization.id) {
    return {
      title: "Post Not Found",
    };
  }

  const description = stripHtml(post.post.description).substring(0, 160);

  return {
    title: `${post.post.title} - ${organization.name}`,
    description,
    openGraph: {
      title: post.post.title,
      description,
      url: `/external/${org}/feedback/${postId}`,
      type: "article",
      images: organization.logoUrl ? [{ url: organization.logoUrl }] : [],
    },
    twitter: {
      card: "summary",
      title: post.post.title,
      description,
      images: organization.logoUrl ? [organization.logoUrl] : [],
    },
  };
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "");
}

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
  const comments = await getPostComments(postId, organization.id);

  // Get session - external users might be anonymous
  const session = await getSession();
  const userId = session?.user?.id;

  // Check if user voted
  const hasUserVoted = userId ? !!(await getUserVote(postId, userId)) : false;

  const config = statusConfig[post.post.status];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DiscussionForumPosting",
    headline: post.post.title,
    text: stripHtml(post.post.description).substring(0, 500),
    datePublished: post.post.createdAt.toISOString(),
    dateModified: post.post.updatedAt.toISOString(),
    author: post.author
      ? {
          "@type": "Person",
          name: post.author.name,
        }
      : {
          "@type": "Person",
          name: "Anonymous",
        },
    interactionStatistic: {
      "@type": "InteractionCounter",
      interactionType: "https://schema.org/LikeAction",
      userInteractionCount: post.post.voteCount,
    },
  };

  return (
    <>
      <script
        // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD structured data is safe with JSON.stringify
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        type="application/ld+json"
      />
      <div className="mx-auto max-w-6xl">
        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Main Content - Left Column */}
          <div className="space-y-8 lg:col-span-8">
            <PostMainContent
              canModify={false}
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
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Author</CardTitle>
                </CardHeader>
                <CardContent>
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
                </CardContent>
              </Card>

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
    </>
  );
}
