"use client";

import Image from "next/image";

type ExternalHeaderProps = {
  organizationName: string;
  logoUrl?: string;
};

export function ExternalHeader({
  organizationName,
  logoUrl,
}: ExternalHeaderProps) {
  return (
    <header className="border-b bg-background">
      <div className="container mx-auto flex h-16 items-center px-4">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <Image
              alt={`${organizationName} logo`}
              className="rounded"
              height={32}
              src={logoUrl}
              width={32}
            />
          ) : null}
          <h1 className="font-semibold text-xl">{organizationName}</h1>
        </div>
      </div>
    </header>
  );
}
