"use client";

import {
  Add01Icon,
  Login01Icon,
  Logout01Icon,
  Settings01Icon,
} from "@hugeicons-pro/core-bulk-rounded";
import { cn } from "@userbubble/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@userbubble/ui/avatar";
import { Button } from "@userbubble/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@userbubble/ui/dropdown-menu";
import { Icon } from "@userbubble/ui/icon";
import { ThemeToggle } from "@userbubble/ui/theme";
import { domAnimation, LazyMotion } from "motion/react";
import * as m from "motion/react-m";
import dynamic from "next/dynamic";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { authClient } from "~/auth/client";

const CreateFeedbackDialog = dynamic(() =>
  import(
    "~/app/external/[org]/feedback/_components/create-feedback-dialog"
  ).then((module) => module.CreateFeedbackDialog)
);
const AuthDialog = dynamic(() =>
  import("~/components/auth/auth-dialog").then((module) => module.AuthDialog)
);

type ExternalHeaderProps = {
  organizationName: string;
  logoUrl?: string;
  orgSlug: string;
  organizationId: string;
  allowAnonymous: boolean;
  memberRole: "admin" | "owner" | "member" | null;
  enableRoadmap: boolean;
};

export function ExternalHeader({
  organizationName,
  logoUrl,
  orgSlug,
  organizationId,
  allowAnonymous,
  memberRole,
  enableRoadmap,
}: ExternalHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const portalPrefix = pathname.startsWith("/external/")
    ? `/external/${orgSlug}`
    : "";
  const [activeDimensions, setActiveDimensions] = useState({
    width: 0,
    left: 0,
    opacity: 0,
  });
  const navRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  // Retain mounted dialogs after first use so their close transitions and drafts survive.
  const [createDialogLoaded, setCreateDialogLoaded] = useState(false);
  const [authDialogLoaded, setAuthDialogLoaded] = useState(false);
  useEffect(() => {
    if (createDialogOpen) {
      setCreateDialogLoaded(true);
    }
    if (authDialogOpen) {
      setAuthDialogLoaded(true);
    }
  }, [createDialogOpen, authDialogOpen]);
  const { data: sessionData } = authClient.useSession();
  const user = sessionData?.user;
  const isIdentified =
    (sessionData?.session as Record<string, unknown> | undefined)
      ?.sessionType === "identified";

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const tabs = useMemo(() => {
    const allTabs = [
      { name: "Feedback", href: `${portalPrefix}/feedback` },
      { name: "Roadmap", href: `${portalPrefix}/roadmap` },
      { name: "Updates", href: `${portalPrefix}/changelog` },
    ];

    // Filter out roadmap if disabled
    return allTabs.filter((tab) => tab.name !== "Roadmap" || enableRoadmap);
  }, [enableRoadmap, portalPrefix]);

  const activeTab =
    tabs.find((tab) => pathname.startsWith(tab.href))?.href ?? "";

  useEffect(() => {
    if (activeTab && navRefs.current[activeTab]) {
      const activeLink = navRefs.current[activeTab];
      if (activeLink) {
        const { width, left } = activeLink.getBoundingClientRect();
        const parentLeft =
          activeLink.parentElement?.getBoundingClientRect().left || 0;
        setActiveDimensions({
          width,
          left: left - parentLeft,
          opacity: 1,
        });
      }
    } else {
      setActiveDimensions((prev) => ({ ...prev, opacity: 0 }));
    }
  }, [activeTab]);

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex h-14 max-w-7xl items-center justify-between px-3 sm:h-16 sm:px-4">
        <div className="flex min-w-0 items-center gap-8">
          <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            {logoUrl ? (
              <Image
                alt={`${organizationName} logo`}
                className="rounded-lg"
                height={28}
                src={logoUrl}
                width={28}
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary sm:h-8 sm:w-8">
                {organizationName.charAt(0)}
              </div>
            )}
            <p className="truncate font-semibold text-base sm:text-lg">
              {organizationName}
            </p>
          </div>

          <nav className="relative hidden items-center md:flex">
            {tabs.map((tab) => (
              <Link
                className={cn(
                  "relative z-10 px-4 py-2 font-medium text-sm transition-colors hover:text-foreground",
                  pathname.startsWith(tab.href)
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
                href={tab.href}
                key={tab.href}
                ref={(el) => {
                  navRefs.current[tab.href] = el;
                }}
              >
                {tab.name}
              </Link>
            ))}
            <LazyMotion features={domAnimation} strict>
              <m.span
                animate={{
                  width: activeDimensions.width,
                  x: activeDimensions.left,
                  opacity: activeDimensions.opacity,
                }}
                className="absolute inset-y-0 my-auto h-7 rounded-xl bg-secondary"
                initial={false}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            </LazyMotion>
          </nav>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    className="gap-1.5 sm:gap-2"
                    size="sm"
                    variant="ghost"
                  >
                    <Avatar>
                      {user.image && (
                        <AvatarImage alt={user.name} src={user.image} />
                      )}
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline">{user.name}</span>
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setCreateDialogOpen(true)}>
                  <Icon icon={Add01Icon} size={16} />
                  <span>Create Post</span>
                </DropdownMenuItem>

                {/* Only show Settings for admin/owner (not identified users) */}
                {!isIdentified &&
                  (memberRole === "admin" || memberRole === "owner") && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        render={
                          <Link
                            href={`${process.env.NEXT_PUBLIC_APP_URL}/org/${orgSlug}/settings`}
                          >
                            <Icon icon={Settings01Icon} size={16} />
                            <span>Settings</span>
                          </Link>
                        }
                      />
                    </>
                  )}

                {/* Don't show Logout for identified users — they're managed by the SDK */}
                {!isIdentified && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={async () => {
                        await authClient.signOut();
                        router.refresh();
                      }}
                    >
                      <Icon icon={Logout01Icon} size={16} />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button onClick={() => setAuthDialogOpen(true)} size="sm">
                <Icon icon={Login01Icon} size={16} />
                <span>Login</span>
              </Button>

              {(authDialogOpen || authDialogLoaded) && (
                <AuthDialog
                  callbackUrl={pathname}
                  onOpenChange={setAuthDialogOpen}
                  onSuccess={() => {
                    toast.success("Welcome back!");
                    router.refresh();
                  }}
                  open={authDialogOpen}
                />
              )}
            </>
          )}

          {(createDialogOpen || createDialogLoaded) && (
            <CreateFeedbackDialog
              allowAnonymous={allowAnonymous}
              onOpenChange={setCreateDialogOpen}
              open={createDialogOpen}
              organizationId={organizationId}
            />
          )}
        </div>
      </div>
    </header>
  );
}
