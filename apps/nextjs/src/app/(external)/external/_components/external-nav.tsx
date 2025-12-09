"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type ExternalNavProps = {
  orgSlug: string;
};

export function ExternalNav({ orgSlug }: ExternalNavProps) {
  const pathname = usePathname();

  const tabs = [
    { name: "Feedback", href: `/${orgSlug}/feedback` },
    { name: "Roadmap", href: `/${orgSlug}/roadmap` },
    { name: "Changelog", href: `/${orgSlug}/changelog` },
  ];

  return (
    <nav className="border-b bg-background">
      <div className="container mx-auto px-4">
        <div className="flex gap-6">
          {tabs.map((tab) => {
            const isActive = pathname.startsWith(tab.href);
            return (
              <Link
                className={`border-b-2 py-3 font-medium text-sm transition-colors ${
                  isActive
                    ? "border-[var(--brand-primary)] text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }
                `}
                href={tab.href}
                key={tab.href}
              >
                {tab.name}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
