"use client";

import { UserIcon } from "@hugeicons-pro/core-bulk-rounded";
import { Button } from "@userbubble/ui/button";
import Link from "next/link";
import { Section } from "../step-section";

type StepGuestSubmissionsProps = {
  orgSlug: string;
  onDone: () => void;
};

export function StepGuestSubmissions({
  orgSlug,
  onDone,
}: StepGuestSubmissionsProps) {
  return (
    <div>
      <p className="mb-6 text-muted-foreground">
        Allow people to submit feedback without signing up
      </p>

      <Section
        description="When enabled, visitors can leave feedback, comments, and votes without creating an account. This reduces friction and increases engagement."
        icon={UserIcon}
        title="Enable Guest Submissions"
      >
        <Button
          className="mt-2"
          onClick={onDone}
          render={<Link href={`/org/${orgSlug}/settings`} />}
          size="sm"
          variant="outline"
        >
          Open feedback settings
        </Button>
      </Section>
    </div>
  );
}
