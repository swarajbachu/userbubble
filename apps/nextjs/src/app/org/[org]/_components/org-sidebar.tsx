"use client";

import { cn } from "@critichut/ui";
import { Checkbox } from "@critichut/ui/checkbox";
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
} from "@critichut/ui/sidebar";
import {
  Cancel01Icon,
  CheckmarkBadge01Icon,
  CircleIcon,
  Clock01Icon,
  EyeIcon,
  HourglassIcon,
  MarketingIcon,
  Message01Icon,
  Route01Icon,
  Settings01Icon,
  UserMultiple02Icon,
} from "@hugeicons-pro/core-bulk-rounded";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";
import { authClient } from "~/auth/client";
import { CreateOrgDialog } from "./create-org-dialog";
import { OrgSwitcher } from "./org-switcher";
import { UserProfileMenu } from "./user-profile-menu";

type OrgSidebarProps = {
  org: string;
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
    badge: undefined,
  },
] as const;

const STATUS_FILTERS = [
  {
    label: "All",
    value: "all",
    color: "text-primary",
    icon: CircleIcon,
  },
  {
    label: "Open",
    value: "open",
    color: "text-blue-500",
    icon: CircleIcon,
  },
  {
    label: "Under Review",
    value: "under_review",
    color: "text-yellow-500",
    icon: EyeIcon,
  },
  {
    label: "Planned",
    value: "planned",
    color: "text-purple-500",
    icon: Clock01Icon,
  },
  {
    label: "In Progress",
    value: "in_progress",
    color: "text-orange-500",
    icon: HourglassIcon,
  },
  {
    label: "Completed",
    value: "completed",
    color: "text-green-500",
    icon: CheckmarkBadge01Icon,
  },
  {
    label: "Closed",
    value: "closed",
    color: "text-slate-500",
    icon: Cancel01Icon,
  },
] as const;

export function OrgSidebar({ org }: OrgSidebarProps) {
  const pathname = usePathname();
  const [status, setStatus] = useQueryState(
    "status",
    parseAsArrayOf(parseAsString).withDefault([])
  );

  // Fetch user session
  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await authClient.getSession();
      return data;
    },
  });

  // Fetch user's organizations
  const { data: organizations } = useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      const { data } = await authClient.organization.list();
      return data;
    },
  });

  const isActive = (href: string) => pathname.includes(href);
  const isOnFeedbackPage = pathname.includes("/feedback");

  // Plan checking logic (using metadata for now)
  const currentOrgData = organizations?.find((o) => o.slug === org);
  const orgPlan = currentOrgData?.metadata
    ? (JSON.parse(currentOrgData.metadata) as { plan?: string }).plan || "free"
    : "free";

  // Determine max organizations based on plan
  let maxOrgs = 1; // free plan
  if (orgPlan === "pro") {
    maxOrgs = 5;
  } else if (orgPlan === "enterprise") {
    maxOrgs = 999;
  }

  const canCreateOrg = (organizations?.length || 0) < maxOrgs;

  const isStatusActive = (value: string) => {
    if (value === "all") {
      return status.length === 0;
    }
    return status.includes(value);
  };

  const toggleStatus = (value: string) => {
    if (value === "all") {
      setStatus(null);
      return;
    }

    if (status.includes(value)) {
      const newStatus = status.filter((s) => s !== value);
      setStatus(newStatus.length > 0 ? newStatus : null);
    } else {
      setStatus([...status, value]);
    }
  };

  // Loading state
  if (!(session && organizations)) {
    return (
      <Sidebar variant="floating">
        <SidebarHeader>
          <div className="h-10 animate-pulse rounded bg-muted" />
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div className="h-10 animate-pulse rounded bg-muted" key={i} />
              ))}
            </div>
          </SidebarGroup>
        </SidebarContent>
      </Sidebar>
    );
  }

  return (
    <Sidebar variant="floating">
      <SidebarHeader>
        <OrgSwitcher currentOrg={org} organizations={organizations || []} />
        <CreateOrgDialog canCreateOrg={canCreateOrg} maxOrgs={maxOrgs} />
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {MAIN_NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    className="h-12"
                    isActive={isActive(item.href)}
                  >
                    <Link
                      className="flex flex-row items-center justify-between gap-4"
                      href={`/org/${org}${item.href}`}
                    >
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
            <SidebarGroupLabel>Filters</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {STATUS_FILTERS.map((filter) => (
                  <SidebarMenuItem key={filter.value}>
                    <SidebarMenuButton
                      className="group justify-between"
                      isActive={isStatusActive(filter.value)}
                      onClick={() => toggleStatus(filter.value)}
                      size="sm"
                    >
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={isStatusActive(filter.value)}
                          className="data-[state=checked]:bg-transparent data-[state=checked]:text-primary"
                        />
                        <span className="text-sm">{filter.label}</span>
                      </div>
                      <Icon
                        className={cn(
                          "size-4 opacity-0 transition-opacity group-hover:opacity-100",
                          isStatusActive(filter.value) && "opacity-100",
                          filter.color
                        )}
                        icon={filter.icon}
                      />
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        {/* Settings Row */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton isActive={pathname.includes("/settings")}>
              <Link
                className="flex flex-row items-center gap-2"
                href={`/org/${org}/settings`}
              >
                <Icon icon={Settings01Icon} size={20} />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Members Row */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton isActive={pathname.includes("/members")}>
              <Link
                className="flex flex-row items-center gap-2"
                href={`/org/${org}/members`}
              >
                <Icon icon={UserMultiple02Icon} size={20} />
                <span>Members</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* Profile Row */}
        {session?.user && (
          <SidebarMenu>
            <SidebarMenuItem>
              <UserProfileMenu user={session.user} />
            </SidebarMenuItem>
          </SidebarMenu>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
