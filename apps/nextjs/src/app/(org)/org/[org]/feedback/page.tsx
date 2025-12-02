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
      <div className="flex items-center justify-between p-6">
        <h1 className="font-bold text-2xl">Requests</h1>
        <CreateRequestButton />
      </div>

      <Suspense
        fallback={
          <div className="space-y-1 p-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
              <div className="h-10 animate-pulse rounded-lg bg-muted" key={i} />
            ))}
          </div>
        }
      >
        <FeedbackBoard org={org} />
      </Suspense>
    </div>
  );
}
