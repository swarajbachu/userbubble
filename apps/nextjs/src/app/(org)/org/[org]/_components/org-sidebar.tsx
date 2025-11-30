"use client";

import { cn } from "@critichut/ui";
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
  MarketingIcon,
  Message01Icon,
  Route01Icon,
  Settings01Icon,
  UserMultiple02Icon,
} from "@hugeicons-pro/core-duotone-rounded";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQueryState } from "nuqs";

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
  { label: "All", value: "all", color: "bg-primary" },
  { label: "Open", value: "open", color: "bg-blue-500" },
  { label: "Under Review", value: "under_review", color: "bg-yellow-500" },
  { label: "Planned", value: "planned", color: "bg-purple-500" },
  { label: "In Progress", value: "in_progress", color: "bg-orange-500" },
  { label: "Completed", value: "completed", color: "bg-green-500" },
  { label: "Closed", value: "closed", color: "bg-slate-500" },
] as const;

export function OrgSidebar({ org, organizationName }: OrgSidebarProps) {
  const pathname = usePathname();
  const [status, setStatus] = useQueryState("status");

  const isActive = (href: string) => pathname.includes(href);
  const isOnFeedbackPage = pathname.includes("/feedback");
  const currentStatus = status ?? "all";

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
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {MAIN_NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)}>
                    <Link href={`/org/${org}${item.href}`}>
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
            <SidebarGroupLabel>Requests</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {STATUS_FILTERS.map((filter) => (
                  <SidebarMenuItem key={filter.value}>
                    <SidebarMenuButton
                      isActive={currentStatus === filter.value}
                      onClick={() =>
                        setStatus(filter.value === "all" ? null : filter.value)
                      }
                      size="sm"
                    >
                      <div
                        className={cn("h-2 w-2 rounded-full", filter.color)}
                      />
                      <span className="text-sm">{filter.label}</span>
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
          <SidebarGroupContent>
            <SidebarMenu>
              {SETTINGS_NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={isActive(item.href)}>
                    <Link href={`/org/${org}${item.href}`}>
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
