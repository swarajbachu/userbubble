"use client";

import { GlobalIcon, Link01Icon } from "@hugeicons-pro/core-bulk-rounded";
import { Button } from "@userbubble/ui/button";
import Link from "next/link";
import { CodeBlock, CopyButton, Section, StepSeparator } from "../step-section";

type StepDomainProps = {
  orgSlug: string;
  onDone: () => void;
};

export function StepDomain({ orgSlug, onDone }: StepDomainProps) {
  const boardUrl = `https://${orgSlug}.userbubble.com/`;

  return (
    <div>
      <p className="mb-6 text-muted-foreground">
        Use your own domain for a more professional and branded experience
      </p>

      <Section
        action={
          <div className="flex gap-2">
            <Button
              onClick={() => window.open(boardUrl, "_blank")}
              size="sm"
              variant="outline"
            >
              Visit
            </Button>
            <CopyButton value={boardUrl} />
          </div>
        }
        description="Your public feedback board URL with feedback, roadmap, and changelog"
        icon={Link01Icon}
        title="Feedback Board Link"
      >
        <CodeBlock code={boardUrl} numbered />
      </Section>

      <StepSeparator />

      <Section
        description="Configure your own domain to make your feedback board more professional"
        icon={GlobalIcon}
        title="Add Custom Domain"
      >
        <Button
          className="mt-2"
          onClick={onDone}
          render={<Link href={`/org/${orgSlug}/settings`} />}
          size="sm"
          variant="outline"
        >
          Configure domain settings
        </Button>
      </Section>
    </div>
  );
}
