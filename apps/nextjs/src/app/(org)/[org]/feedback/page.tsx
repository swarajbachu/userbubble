import { Suspense } from "react";
import { FeedbackBoard } from "./_components/feedback-board";
import { FeedbackFilters } from "./_components/feedback-filters";
import { NewPostButton } from "./_components/new-post-button";

interface FeedbackPageProps {
  params: Promise<{ org: string }>;
  searchParams: Promise<{ status?: string; sort?: string }>;
}

export default async function FeedbackPage({
  params,
  searchParams,
}: FeedbackPageProps) {
  const { org } = await params;
  const filters = await searchParams;

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-bold text-3xl">Feedback</h1>
          <p className="text-muted-foreground mt-2">
            Share your ideas and vote on what matters most
          </p>
        </div>
        <NewPostButton org={org} />
      </div>

      <div className="mb-6">
        <FeedbackFilters org={org} />
      </div>

      <Suspense
        fallback={
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-lg bg-muted"
              />
            ))}
          </div>
        }
      >
        <FeedbackBoard org={org} filters={filters} />
      </Suspense>
    </div>
  );
}
