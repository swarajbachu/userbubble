"use client";

import {
  ArrowDown01Icon,
  Building02Icon,
  Tick02Icon,
} from "@hugeicons-pro/core-bulk-rounded";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@userbubble/ui/dropdown-menu";
import { Icon } from "@userbubble/ui/icon";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@userbubble/ui/sidebar";
import { usePathname, useRouter } from "next/navigation";

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
  const router = useRouter();
  const pathname = usePathname();
  const { isMobile } = useSidebar();

  const currentOrgData = organizations?.find((org) => org.slug === currentOrg);

  const handleSelect = (slug: string) => {
    if (slug === currentOrg) {
      return;
    }
    const newPath = pathname.replace(`/org/${currentOrg}`, `/org/${slug}`);
    router.push(newPath);
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                size="lg"
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Icon icon={Building02Icon} size={16} />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">
                    {currentOrgData?.name || currentOrg}
                  </span>
                </div>
                <Icon
                  className="ml-auto text-muted-foreground"
                  icon={ArrowDown01Icon}
                  size={16}
                />
              </SidebarMenuButton>
            }
          />
          <DropdownMenuContent
            align="start"
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "bottom"}
            sideOffset={4}
          >
            {organizations?.map((org) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => handleSelect(org.slug)}
              >
                <Icon icon={Building02Icon} size={16} />
                <span className="flex-1 truncate">{org.name}</span>
                {org.slug === currentOrg && (
                  <Icon
                    className="ml-auto shrink-0"
                    icon={Tick02Icon}
                    size={16}
                  />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
