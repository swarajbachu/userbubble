"use client";

import { PaintBoardIcon } from "@hugeicons-pro/core-bulk-rounded";
import { Button } from "@userbubble/ui/button";
import { Input } from "@userbubble/ui/input";
import Link from "next/link";
import { Section } from "../step-section";

type StepBrandingProps = {
  orgSlug: string;
  orgName: string;
  onDone: () => void;
};

export function StepBranding({ orgSlug, orgName, onDone }: StepBrandingProps) {
  return (
    <div>
      <p className="mb-6 text-muted-foreground">
        Make your feedback board match your brand with custom logo, colors, and
        name
      </p>

      <Section
        description="The name that appears on your public feedback board"
        icon={PaintBoardIcon}
        title="Product Name"
      >
        <Input className="mt-2" defaultValue={orgName} disabled />
      </Section>

      <div className="mt-8">
        <Button
          onClick={onDone}
          render={<Link href={`/org/${orgSlug}/settings`} />}
          size="sm"
        >
          Customize in settings
        </Button>
      </div>
    </div>
  );
}
