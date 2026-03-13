"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Agreement03Icon,
  Bookmark01Icon,
  Road01Icon,
  Settings01Icon,
  UserMultiple02Icon,
} from "@hugeicons-pro/core-bulk-rounded";
import { ArrowRight01Icon } from "@hugeicons-pro/core-duotone-rounded";
import { useQuery } from "@tanstack/react-query";
import type { OnboardingState } from "@userbubble/db/schema";
import { cn } from "@userbubble/ui";
import { Icon } from "@userbubble/ui/icon";
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
} from "@userbubble/ui/sidebar";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { parseAsArrayOf, parseAsString, useQueryState } from "nuqs";
import { authClient } from "~/auth/client";
import { allStatus, statuses } from "~/components/feedback/config";
import { OrgSwitcher } from "./org-switcher";
import { UserProfileMenu } from "./user-profile-menu";

type OrgSidebarProps = {
  org: string;
  onboarding: OnboardingState | null;
};

const MAIN_NAV_ITEMS = [
  {
    title: "Requests",
    href: "/feedback",
    icon: Bookmark01Icon,
    badge: undefined,
  },
  {
    title: "Roadmap",
    href: "/roadmap",
    icon: Road01Icon,
    badge: undefined,
  },
  {
    title: "Changelog",
    href: "/changelog",
    icon: Agreement03Icon,
    badge: undefined,
  },
] as const;

const SECONDARY_NAV_ITEMS = [
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
  {
    value: "all" as const,
    icon: allStatus.icon,
    color: allStatus.color,
    label: allStatus.label,
  },
  ...statuses.map((s) => ({
    value: s.value,
    icon: s.icon,
    color: s.color,
    label: s.label,
    ...("strokeWidth" in s ? { strokeWidth: s.strokeWidth } : {}),
  })),
];

const ONBOARDING_KEYS: (keyof OnboardingState)[] = [
  "createApiKey",
  "installWidget",
  "anonymousSubmissions",
  "customizeBranding",
  "shareBoard",
];

const ACTIVE_STYLES = [
  "relative bg-[#F9F9FA]",
  "shadow-[0px_11px_4px_rgba(7,7,8,0.01),0px_6px_4px_rgba(7,7,8,0.02),0px_3px_3px_rgba(7,7,8,0.04),0px_1px_1px_rgba(7,7,8,0.05)]",
  "before:absolute before:inset-0 before:rounded-md before:border before:border-white/5 before:content-['']",
  "after:absolute after:inset-0 after:rounded-md after:bg-[radial-gradient(at_top,rgba(255,255,255,0.05)_5%,rgba(255,255,255,0)_100%)] after:shadow-[inset_0px_-2px_0px_0px_rgba(7,7,8,0.06)] after:content-['']",
  "dark:bg-[#2A2A2A] dark:shadow-md dark:after:shadow-[inset_0px_-2px_0px_0px_rgba(7,7,8,0.3)]",
];

export function OrgSidebar({ org, onboarding }: OrgSidebarProps) {
  const pathname = usePathname();
  const [status, setStatus] = useQueryState(
    "status",
    parseAsArrayOf(parseAsString).withDefault([])
  );

  const { data: session } = useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await authClient.getSession();
      return data;
    },
  });

  const { data: organizations } = useQuery({
    queryKey: ["organizations"],
    queryFn: async () => {
      const { data } = await authClient.organization.list();
      return data;
    },
  });

  const isActive = (href: string) => pathname.includes(href);
  const isOnFeedbackPage = pathname.includes("/feedback");

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

  if (!(session && organizations)) {
    return (
      <Sidebar variant="inset">
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
    <Sidebar variant="inset">
      <SidebarHeader>
        <OrgSwitcher currentOrg={org} organizations={organizations || []} />
      </SidebarHeader>

      <SidebarContent>
        {/* Main Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-2">
              {MAIN_NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    className={cn(
                      "h-8 transition-all duration-200",
                      isActive(item.href) && ACTIVE_STYLES
                    )}
                    isActive={isActive(item.href)}
                  >
                    <Link
                      className="relative z-10 flex w-full flex-row items-center justify-between gap-4"
                      href={`/org/${org}${item.href}`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon icon={item.icon} size={20} strokeWidth={0} />
                        <span>{item.title}</span>
                      </div>
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
                        <Icon
                          className={cn("size-4", filter.color)}
                          icon={filter.icon}
                          {...("strokeWidth" in filter && {
                            strokeWidth: filter.strokeWidth,
                          })}
                        />
                        <span className="text-sm">{filter.label}</span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Secondary Navigation */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            <SidebarMenu>
              {SECONDARY_NAV_ITEMS.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    className={cn(
                      "transition-all duration-200",
                      isActive(item.href) && ACTIVE_STYLES
                    )}
                    isActive={isActive(item.href)}
                  >
                    <Link
                      className="relative z-10 flex w-full flex-row items-center gap-2"
                      href={`/org/${org}${item.href}`}
                    >
                      <Icon icon={item.icon} size={20} strokeWidth={0} />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        {/* Onboarding Banner */}
        {onboarding &&
          (() => {
            const completed = ONBOARDING_KEYS.filter(
              (k) => onboarding[k]
            ).length;
            const total = ONBOARDING_KEYS.length;
            if (completed === total) {
              return null;
            }
            return (
              <Link
                className="group flex flex-col gap-2 rounded-lg border bg-muted/50 p-3 transition-colors hover:bg-muted"
                href={`/org/${org}/getting-started`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-xs">Getting Started</span>
                  <span className="text-muted-foreground text-xs">
                    {completed}/{total}
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-muted-foreground/20">
                  <div
                    className="h-full rounded-full bg-green-500 transition-all duration-300"
                    style={{ width: `${(completed / total) * 100}%` }}
                  />
                </div>
                <div className="flex items-center gap-1 text-muted-foreground text-xs group-hover:text-foreground">
                  <span>Continue setup</span>
                  <HugeiconsIcon icon={ArrowRight01Icon} size={12} />
                </div>
              </Link>
            );
          })()}

        {/* User Menu */}
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
