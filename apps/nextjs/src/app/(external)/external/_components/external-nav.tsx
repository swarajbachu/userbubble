"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type ExternalNavProps = {
  org: string;
};

export function ExternalNav({ org }: ExternalNavProps) {
  const pathname = usePathname();

  const links = [
    { href: `/external/${org}/feedback`, label: "Feedback" },
    { href: `/external/${org}/roadmap`, label: "Roadmap" },
    { href: `/external/${org}/changelog`, label: "Changelog" },
  ];

  return (
    <nav className="border-b bg-muted/30">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex gap-6">
          {links.map((link) => {
            const isActive = pathname?.includes(link.href);
            return (
              <Link
                className={`border-b-2 px-1 py-3 font-medium text-sm transition-colors ${
                  isActive
                    ? "border-[var(--brand-primary)] text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }
                `}
                href={link.href}
                key={link.href}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
