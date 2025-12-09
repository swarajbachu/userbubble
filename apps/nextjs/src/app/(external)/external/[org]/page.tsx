import { organizationQueries } from "@critichut/db/queries";
import { parseOrganizationSettings } from "@critichut/db/schema";
import { Icon } from "@critichut/ui/icon";
import type { IconSvgElement } from "@hugeicons/react";
import {
  File01Icon,
  Message01Icon,
  RoadIcon,
} from "@hugeicons-pro/core-duotone-rounded";
import Link from "next/link";
import { notFound } from "next/navigation";

type ExternalHomePageProps = {
  params: Promise<{ org: string }>;
};

export default async function ExternalHomePage({
  params,
}: ExternalHomePageProps) {
  const { org } = await params;
  const organization = await organizationQueries.findBySlug(org);

  if (!organization) {
    notFound();
  }

  const _settings = parseOrganizationSettings(organization.metadata);

  return (
    <div className="space-y-12 py-8">
      <div className="space-y-4 text-center">
        <h1 className="font-bold text-4xl">Welcome to {organization.name}</h1>
        <p className="mx-auto max-w-2xl text-muted-foreground text-xl">
          Share your ideas, vote on features, and see what we're building next
        </p>
      </div>

      <div className="mx-auto grid max-w-4xl gap-6 md:grid-cols-3">
        <LinkCard
          description="Submit feature requests and report issues"
          href={`/external/${org}/feedback`}
          icon={Message01Icon}
          title="Feedback"
        />
        <LinkCard
          description="See what we're working on next"
          href={`/external/${org}/roadmap`}
          icon={RoadIcon}
          title="Roadmap"
        />
        <LinkCard
          description="View recent updates and releases"
          href={`/external/${org}/changelog`}
          icon={File01Icon}
          title="Changelog"
        />
      </div>
    </div>
  );
}

function LinkCard({
  href,
  icon: IconComponent,
  title,
  description,
}: {
  href: string;
  icon: IconSvgElement;
  title: string;
  description: string;
}) {
  return (
    <Link
      className="group block rounded-lg border bg-card p-6 transition-colors hover:bg-accent/50"
      href={href}
    >
      <div className="flex flex-col items-center space-y-3 text-center">
        <div
          className="rounded-full bg-primary/10 p-3 transition-colors group-hover:bg-primary/20"
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--brand-accent) 10%, transparent)",
          }}
        >
          <Icon
            className="text-[var(--brand-primary)]"
            icon={IconComponent}
            size={32}
          />
        </div>
        <h3 className="font-semibold text-lg">{title}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </Link>
  );
}
