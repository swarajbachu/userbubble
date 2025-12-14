"use client";

import { Button } from "@critichut/ui/button";
import { Icon } from "@critichut/ui/icon";
import { Popover, PopoverContent, PopoverTrigger } from "@critichut/ui/popover";
import {
  ArrowDown01Icon,
  Building02Icon,
  Tick02Icon,
} from "@hugeicons-pro/core-bulk-rounded";
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
      <PopoverTrigger>
        <Button
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
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[--radix-popover-trigger-width] p-0"
      >
        <Command>
          <CommandInput placeholder="Search organizations..." />
          <CommandList>
            <CommandEmpty>No organizations found.</CommandEmpty>
            <CommandGroup>
              {organizations?.map((org) => (
                <CommandItem
                  data-checked={org.slug === currentOrg}
                  key={org.id}
                  onSelect={() => handleSelect(org.slug)}
                  value={org.slug}
                >
                  <Icon icon={Building02Icon} size={16} />
                  <span>{org.name}</span>
                  {org.slug === currentOrg && (
                    <Icon className="ml-auto" icon={Tick02Icon} size={16} />
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
