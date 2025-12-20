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
import { toast } from "@userbubble/ui/toast";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { CreateFeedbackDialog } from "~/app/external/[org]/feedback/_components/create-feedback-dialog";
import { authClient } from "~/auth/client";
import { AuthDialog } from "~/components/auth/auth-dialog";

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
  const [activeTab, setActiveTab] = useState<string>("");
  const [activeDimensions, setActiveDimensions] = useState({
    width: 0,
    left: 0,
    opacity: 0,
  });
  const navRefs = useRef<Record<string, HTMLAnchorElement | null>>({});
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const { data: session } = authClient.useSession();
  const user = session?.user;

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

  const tabs = useMemo(() => {
    const allTabs = [
      { name: "Feedback", href: "/feedback" },
      { name: "Roadmap", href: "/roadmap" },
      { name: "Updates", href: "/changelog" },
    ];

    // Filter out roadmap if disabled
    return allTabs.filter((tab) => tab.name !== "Roadmap" || enableRoadmap);
  }, [enableRoadmap]);

  useEffect(() => {
    const active = tabs.find((tab) => pathname.startsWith(tab.href));
    setActiveTab(active ? active.href : "");
  }, [pathname, tabs]);

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
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <Image
                alt={`${organizationName} logo`}
                className="rounded-lg"
                height={32}
                src={logoUrl}
                width={32}
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 font-bold text-primary">
                {organizationName.charAt(0)}
              </div>
            )}
            <h1 className="font-semibold text-lg">{organizationName}</h1>
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
            <motion.span
              animate={{
                width: activeDimensions.width,
                x: activeDimensions.left,
                opacity: activeDimensions.opacity,
              }}
              className="absolute inset-y-0 my-auto h-7 rounded-xl bg-secondary"
              initial={false}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />

          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button className="gap-2" size="sm" variant="ghost">
                    <Avatar size="sm">
                      {user.image && (
                        <AvatarImage alt={user.name} src={user.image} />
                      )}
                      <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline">{user.name}</span>
                  </Button>
                }
              />
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setCreateDialogOpen(true)}>
                  <Icon icon={Add01Icon} size={16} />
                  <span>Create Post</span>
                </DropdownMenuItem>

                {/* Only show Settings for admin/owner */}
                {(memberRole === "admin" || memberRole === "owner") && (
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

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => authClient.signOut()}>
                  <Icon icon={Logout01Icon} size={16} />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button onClick={() => setAuthDialogOpen(true)} size="sm">
                <Icon icon={Login01Icon} size={16} />
                <span>Login</span>
              </Button>

              <AuthDialog
                onOpenChange={setAuthDialogOpen}
                onSuccess={() => {
                  toast.success("Welcome back!");
                }}
                open={authDialogOpen}
              />
            </>
          )}

          <CreateFeedbackDialog
            allowAnonymous={allowAnonymous}
            onOpenChange={setCreateDialogOpen}
            open={createDialogOpen}
            organizationId={organizationId}
          />
        </div>
      </div>
    </header>
  );
}
