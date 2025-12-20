"use client";

import {
  ArrowDown01Icon,
  Building02Icon,
  Tick02Icon,
} from "@hugeicons-pro/core-bulk-rounded";
import { Button } from "@userbubble/ui/button";
import { Icon } from "@userbubble/ui/icon";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@userbubble/ui/popover";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

type Organization = {
  id: string;
  name: string;
  slug: string;
  logo?: string | null;
};

type OrgSwitcherProps = {
  currentOrg: string;
  organizations: Organization[];
};

export function OrgSwitcher({ currentOrg, organizations }: OrgSwitcherProps) {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const currentOrgData = organizations?.find((org) => org.slug === currentOrg);

  const handleSelect = (slug: string) => {
    if (slug === currentOrg) {
      setOpen(false);
      return;
    }

    // Replace current org slug in pathname
    const newPath = pathname.replace(`/org/${currentOrg}`, `/org/${slug}`);
    router.push(newPath);
    setOpen(false);
  };

  return (
    <Popover onOpenChange={setOpen} open={open}>
      <PopoverTrigger
        render={(props) => (
          <Button
            {...props}
            className="h-auto w-full justify-between px-3 py-2"
            variant="ghost"
          >
            <div className="flex min-w-0 items-center gap-2">
              <Icon className="shrink-0" icon={Building02Icon} size={20} />
              <span className="truncate font-semibold">
                {currentOrgData?.name || currentOrg}
              </span>
            </div>
            <Icon
              className="shrink-0 text-muted-foreground"
              icon={ArrowDown01Icon}
              size={16}
            />
          </Button>
        )}
      />
      <PopoverContent
        align="start"
        className="w-[--radix-popover-trigger-width] p-1"
      >
        <div className="space-y-0.5">
          {organizations?.map((org) => (
            <button
              className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent"
              key={org.id}
              onClick={() => handleSelect(org.slug)}
              type="button"
            >
              <Icon icon={Building02Icon} size={16} />
              <span className="flex-1 truncate text-left">{org.name}</span>
              {org.slug === currentOrg && (
                <Icon className="shrink-0" icon={Tick02Icon} size={16} />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
