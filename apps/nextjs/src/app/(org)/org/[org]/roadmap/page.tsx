import { Suspense } from "react";
import { RoadmapBoard } from "./_components/roadmap-board";

type RoadmapPageProps = {
  params: Promise<{ org: string }>;
};

export default async function RoadmapPage({ params }: RoadmapPageProps) {
  const { org } = await params;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <h1 className="font-bold text-3xl">Roadmap</h1>
        <p className="mt-2 text-muted-foreground">
          See what we're working on and what's coming next
        </p>
      </div>

      <Suspense
        fallback={
          <div className="grid gap-6 md:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div className="space-y-4" key={i}>
                <div className="h-8 w-32 animate-pulse rounded bg-muted" />
                <div className="space-y-3">
                  {[1, 2].map((j) => (
                    <div
                      className="h-24 animate-pulse rounded-lg bg-muted"
                      key={j}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        }
      >
        <RoadmapBoard org={org} />
      </Suspense>
    </div>
  );
}
