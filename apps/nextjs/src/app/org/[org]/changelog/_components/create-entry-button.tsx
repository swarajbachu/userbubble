"use client";

import { Button } from "@critichut/ui/button";
import { Icon } from "@critichut/ui/icon";
import { Add01Icon } from "@hugeicons-pro/core-bulk-rounded";
import Link from "next/link";

type CreateEntryButtonProps = {
  org: string;
};

export function CreateEntryButton({ org }: CreateEntryButtonProps) {
  return (
    <Button render={<Link href={`/org/${org}/changelog/create`} />} size="lg">
      <Icon icon={Add01Icon} size={20} />
      Create Entry
    </Button>
  );
}
