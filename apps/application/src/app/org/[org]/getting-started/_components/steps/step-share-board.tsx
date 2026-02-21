"use client";

import {
  MarketingIcon,
  Message01Icon,
  Route01Icon,
} from "@hugeicons-pro/core-bulk-rounded";
import { Button } from "@userbubble/ui/button";
import { CodeBlock, CopyButton, Section, StepSeparator } from "../step-section";

type StepShareBoardProps = {
  orgSlug: string;
  onDone: () => void;
};

export function StepShareBoard({ orgSlug, onDone }: StepShareBoardProps) {
  const baseUrl = `https://${orgSlug}.userbubble.com`;

  return (
    <div>
      <p className="mb-6 text-muted-foreground">
        Get your feedback board link and add it to your website
      </p>

      <Section
        action={
          <div className="flex gap-2">
            <Button
              onClick={() => window.open(`${baseUrl}/`, "_blank")}
              size="sm"
              variant="outline"
            >
              Visit
            </Button>
            <CopyButton value={`${baseUrl}/`} />
          </div>
        }
        description="This link includes feedback, roadmap, and changelog all in one place"
        icon={Message01Icon}
        title="Feedback Board"
      >
        <CodeBlock code={`${baseUrl}/`} numbered />
      </Section>

      <StepSeparator />

      <Section
        action={<CopyButton value={`${baseUrl}/roadmap`} />}
        badge="Optional"
        description="Direct link to your roadmap if you want to link to it separately"
        icon={Route01Icon}
        title="Roadmap"
      >
        <CodeBlock code={`${baseUrl}/roadmap`} numbered />
      </Section>

      <StepSeparator />

      <Section
        action={<CopyButton value={`${baseUrl}/updates`} />}
        badge="Optional"
        description="Direct link to your changelog if you want to link to it separately"
        icon={MarketingIcon}
        title="Updates"
      >
        <CodeBlock code={`${baseUrl}/updates`} numbered />
        <div className="mt-4">
          <Button onClick={onDone} size="sm">
            Done
          </Button>
        </div>
      </Section>

      <StepSeparator />

      <div className="border-muted-foreground/20 border-l-2 py-2 pl-4">
        <p className="font-semibold text-sm">Bring your own domain</p>
        <p className="text-muted-foreground text-sm">
          Available in domain settings
        </p>
      </div>
    </div>
  );
}
