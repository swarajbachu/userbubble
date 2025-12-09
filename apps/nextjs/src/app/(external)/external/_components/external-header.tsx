"use client";

import type { Organization, OrganizationSettings } from "@critichut/db/schema";
import { Button } from "@critichut/ui/button";
import { Icon } from "@critichut/ui/icon";
import { Login02Icon } from "@hugeicons-pro/core-duotone-rounded";
import Image from "next/image";
import { authClient } from "~/auth/client";

type ExternalHeaderProps = {
  organization: Organization;
  settings: OrganizationSettings;
};

export function ExternalHeader({
  organization,
  settings,
}: ExternalHeaderProps) {
  const { data: session } = authClient.useSession();

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-3">
          {settings.branding.logoUrl ? (
            <Image
              alt={organization.name}
              className="h-8 w-auto"
              height={32}
              src={settings.branding.logoUrl}
              width={32}
            />
          ) : null}
          <h1
            className="font-bold text-xl"
            style={{ color: "var(--brand-primary)" }}
          >
            {organization.name}
          </h1>
        </div>

        <div>
          {session?.user ? (
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground text-sm">
                {session.user.name}
              </span>
            </div>
          ) : (
            <Button size="sm" variant="ghost">
              <Icon icon={Login02Icon} size={18} />
              Sign in
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
