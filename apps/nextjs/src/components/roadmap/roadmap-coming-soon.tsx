import { HugeiconsIcon } from "@hugeicons/react";
import { RoadIcon } from "@hugeicons-pro/core-bulk-rounded";
import { DoubleCard, DoubleCardInner } from "@userbubble/ui/double-card";

export function RoadmapComingSoon() {
  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center p-4">
      <DoubleCard className="w-full max-w-md">
        <DoubleCardInner className="flex flex-col items-center justify-center p-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <HugeiconsIcon
              className="text-muted-foreground"
              icon={RoadIcon}
              size={32}
            />
          </div>

          <h1 className="mb-2 font-semibold text-2xl">Roadmap Coming Soon</h1>
          <p className="mb-4 max-w-sm text-muted-foreground text-sm">
            The roadmap feature is currently disabled. Check back later to see
            what we're planning!
          </p>
        </DoubleCardInner>
      </DoubleCard>
    </div>
  );
}
