"use client";

import { cn } from "@userbubble/ui";
import { Button } from "@userbubble/ui/button";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

type ExternalHeaderProps = {
  organizationName: string;
  logoUrl?: string;
  orgSlug: string;
};

export function ExternalHeader({
  organizationName,
  logoUrl,
  orgSlug,
}: ExternalHeaderProps) {
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState<string>("");
  const [activeDimensions, setActiveDimensions] = useState({
    width: 0,
    left: 0,
    opacity: 0,
  });
  const navRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

  const tabs = useMemo(
    () => [
      { name: "Feedback", href: `/external/${orgSlug}/feedback` },
      { name: "Roadmap", href: `/external/${orgSlug}/roadmap` },
      { name: "Updates", href: `/external/${orgSlug}/changelog` },
    ],
    [orgSlug]
  );

  useEffect(() => {
    const active = tabs.find((tab) => pathname.startsWith(tab.href));
    console.log(active, "active");
    console.log(pathname, "pathname");
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
          <Button size="sm" variant="secondary">
            <Link href="/dashboard">Dashboard</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
