import { Suspense } from "react";
import { CreateRequestButton } from "./_components/create-request-button";
import { FeedbackBoard } from "./_components/feedback-board";

type FeedbackPageProps = {
  params: Promise<{ org: string }>;
  searchParams: Promise<{ status?: string; sort?: string }>;
};

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
          <h1 className="font-bold text-3xl">Requests & Feedback</h1>
          <p className="mt-2 text-muted-foreground">
            Share your ideas and vote on what matters most
          </p>
        </div>
        <CreateRequestButton />
      </div>

      <Suspense
        fallback={
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div className="h-32 animate-pulse rounded-lg bg-muted" key={i} />
            ))}
          </div>
        }
      >
        <FeedbackBoard filters={filters} org={org} />
      </Suspense>
    </div>
  );
}
