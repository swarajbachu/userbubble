import { Suspense } from "react";
import { CreateRequestButton } from "./_components/create-request-button";
import { FeedbackBoard } from "./_components/feedback-board";

type FeedbackPageProps = {
  params: Promise<{ org: string }>;
  searchParams: Promise<{ status?: string; sort?: string }>;
};

export default async function FeedbackPage({ params }: FeedbackPageProps) {
  const { org } = await params;

  return (
    <div className="w-full">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="font-bold text-2xl">Requests</h1>
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
        <FeedbackBoard org={org} />
      </Suspense>
    </div>
  );
}
