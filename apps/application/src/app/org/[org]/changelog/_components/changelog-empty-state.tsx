import { Add01Icon, Rocket01Icon } from "@hugeicons-pro/core-bulk-rounded";
import { Button } from "@userbubble/ui/button";
import { DoubleCard, DoubleCardInner } from "@userbubble/ui/double-card";
import { Icon } from "@userbubble/ui/icon";
import Link from "next/link";

type ChangelogEmptyStateProps = {
  isAdmin: boolean;
  org: string;
  isFiltered?: boolean;
};

export function ChangelogEmptyState({
  isAdmin,
  org,
  isFiltered = false,
}: ChangelogEmptyStateProps) {
  if (isFiltered) {
    return (
      <DoubleCard>
        <DoubleCardInner className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
            <Icon
              className="text-muted-foreground"
              icon={Rocket01Icon}
              size={24}
            />
          </div>
          <h3 className="mt-4 font-semibold text-lg">No entries found</h3>
          <p className="mt-2 max-w-sm text-muted-foreground text-sm">
            Try adjusting your filters to see more changelog entries.
          </p>
        </DoubleCardInner>
      </DoubleCard>
    );
  }

  if (isAdmin) {
    return (
      <DoubleCard>
        <DoubleCardInner className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Icon className="text-primary" icon={Rocket01Icon} size={24} />
          </div>
          <h3 className="mt-4 font-semibold text-lg">
            Create your first changelog entry
          </h3>
          <p className="mt-2 max-w-sm text-muted-foreground text-sm">
            Share product updates, new features, and improvements with your
            users.
          </p>
          <div className="mt-6">
            <Button
              render={<Link href={`/org/${org}/changelog/create`} />}
              size="lg"
            >
              <Icon icon={Add01Icon} size={20} />
              Create Entry
            </Button>
          </div>
        </DoubleCardInner>
      </DoubleCard>
    );
  }

  return (
    <DoubleCard>
      <DoubleCardInner className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Icon
            className="text-muted-foreground"
            icon={Rocket01Icon}
            size={24}
          />
        </div>
        <h3 className="mt-4 font-semibold text-lg">No updates yet</h3>
        <p className="mt-2 max-w-sm text-muted-foreground text-sm">
          Check back soon for product updates and release notes.
        </p>
      </DoubleCardInner>
    </DoubleCard>
  );
}
