export function ChangelogSkeleton() {
  return (
    <div className="relative space-y-8">
      {/* Timeline line */}
      <div className="absolute top-0 bottom-0 left-[9px] w-0.5 bg-border" />

      {/* Month group 1 */}
      <div className="space-y-4">
        {/* Month header */}
        <div className="flex items-center gap-4">
          <div className="h-5 w-5 shrink-0 animate-pulse rounded-full bg-muted" />
          <div className="h-6 w-32 animate-pulse rounded bg-muted" />
        </div>

        {/* Entries */}
        <div className="ml-9 space-y-4">
          {[1, 2].map((i) => (
            <div className="rounded-lg border bg-card p-6" key={`group1-${i}`}>
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-7 w-3/4 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <div className="h-4 w-full animate-pulse rounded bg-muted" />
                  <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-4/6 animate-pulse rounded bg-muted" />
                </div>

                {/* Tags */}
                <div className="flex gap-2">
                  <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
                  <div className="h-6 w-24 animate-pulse rounded-full bg-muted" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Month group 2 */}
      <div className="space-y-4">
        {/* Month header */}
        <div className="flex items-center gap-4">
          <div className="h-5 w-5 shrink-0 animate-pulse rounded-full bg-muted" />
          <div className="h-6 w-32 animate-pulse rounded bg-muted" />
        </div>

        {/* Entries */}
        <div className="ml-9 space-y-4">
          {[1].map((i) => (
            <div className="rounded-lg border bg-card p-6" key={`group2-${i}`}>
              <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-7 w-3/4 animate-pulse rounded bg-muted" />
                    <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
                  </div>
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <div className="h-4 w-full animate-pulse rounded bg-muted" />
                  <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
                </div>

                {/* Tags */}
                <div className="flex gap-2">
                  <div className="h-6 w-20 animate-pulse rounded-full bg-muted" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
