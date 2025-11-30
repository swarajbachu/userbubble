"use client";

import { Icon } from "@critichut/ui/icon";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@critichut/ui/sidebar";
import {
  FilterIcon,
  MarketingIcon,
  Message01Icon,
  Route01Icon,
  Settings01Icon,
  UserMultiple02Icon,
} from "@hugeicons-pro/core-duotone-rounded";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type OrgSidebarProps = {
  org: string;
  organizationName: string;
};

const MAIN_NAV_ITEMS = [
  {
    title: "Requests",
    href: "/feedback",
    icon: Message01Icon,
    badge: undefined,
  },
  {
    title: "Roadmap",
    href: "/roadmap",
    icon: Route01Icon,
    badge: undefined,
  },
  {
    title: "Changelog",
    href: "/changelog",
    icon: MarketingIcon,
    badge: "Soon" as const,
  },
] as const;

const SETTINGS_NAV_ITEMS = [
  {
    title: "Settings",
    href: "/settings",
    icon: Settings01Icon,
  },
  {
    title: "Members",
    href: "/members",
    icon: UserMultiple02Icon,
  },
] as const;

const STATUS_FILTERS = [
  { label: "All", value: "all" },
  { label: "Open", value: "open" },
  { label: "Under Review", value: "under_review" },
  { label: "Planned", value: "planned" },
  { label: "In Progress", value: "in_progress" },
  { label: "Completed", value: "completed" },
  { label: "Closed", value: "closed" },
] as const;

export function OrgSidebar({ org, organizationName }: OrgSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentStatus = searchParams.get("status") ?? "all";

  const isActive = (href: string) => pathname.includes(href);
  const isOnFeedbackPage = pathname.includes("/feedback");

  return (
    <Sidebar variant="inset">
      <SidebarHeader>
        <div className="flex items-center justify-between px-4 py-2">
          <h2 className="truncate font-semibold text-lg">{organizationName}</h2>
          <SidebarTrigger />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {MAIN_NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)}>
                    <Link href={`/${org}${item.href}`}>
                      <Icon icon={item.icon} size={20} />
                      <span>{item.title}</span>
                      {item.badge && (
                        <span className="ml-auto text-muted-foreground text-xs">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Status Filters (only on feedback page) */}
        {isOnFeedbackPage && (
          <SidebarGroup>
            <SidebarGroupLabel>
              <Icon icon={FilterIcon} size={16} />
              <span>Filter by Status</span>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {STATUS_FILTERS.map((status) => (
                  <SidebarMenuItem key={status.value}>
                    <SidebarMenuButton
                      asChild
                      isActive={currentStatus === status.value}
                      size="sm"
                    >
                      <Link
                        href={`/${org}/feedback${
                          status.value === "all"
                            ? ""
                            : `?status=${status.value}`
                        }`}
                      >
                        <span className="text-sm">{status.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        {/* Settings Section */}
        <SidebarGroup>
          <SidebarGroupLabel>Organization</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {SETTINGS_NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)}>
                    <Link href={`/${org}${item.href}`}>
                      <Icon icon={item.icon} size={20} />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  );
}
