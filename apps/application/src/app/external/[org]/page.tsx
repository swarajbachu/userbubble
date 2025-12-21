import { HugeiconsIcon } from "@hugeicons/react";
import {
  Message01Icon,
  RoadIcon,
  TaskDaily01Icon,
} from "@hugeicons-pro/core-duotone-rounded";
import { parseOrganizationSettings } from "@userbubble/db/schema";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@userbubble/ui/card";
import Link from "next/link";
import { getPublicOrganization } from "~/lib/get-organization";

type ExternalHomePageProps = {
  params: Promise<{ org: string }>;
};

export default async function ExternalHomePage({
  params,
}: ExternalHomePageProps) {
  const { org } = await params;

  // Use public helper - no auth required for external routes
  const organization = await getPublicOrganization(org);

  // Parse organization settings
  const settings = parseOrganizationSettings(organization.metadata);

  const allFeatures = [
    {
      title: "Feedback",
      description: "Share your ideas and vote on features you'd like to see",
      href: `/${org}/feedback`,
      icon: Message01Icon,
    },
    {
      title: "Roadmap",
      description: "See what we're working on and what's coming next",
      href: `/${org}/roadmap`,
      icon: RoadIcon,
    },
    {
      title: "Changelog",
      description: "Stay updated with our latest releases and improvements",
      href: `/${org}/changelog`,
      icon: TaskDaily01Icon,
    },
  ];

  // Filter out roadmap if disabled
  const features = allFeatures.filter(
    (feature) =>
      feature.title !== "Roadmap" || (settings.feedback?.enableRoadmap ?? true)
  );

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="font-bold text-4xl tracking-tight">
          Welcome to {organization.name}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Help us build better products by sharing your feedback and ideas
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {features.map((feature) => (
          <Link href={feature.href} key={feature.href}>
            <Card className="h-full transition-colors hover:bg-accent">
              <CardHeader>
                <HugeiconsIcon
                  color="var(--brand-primary)"
                  icon={feature.icon}
                  size={48}
                  strokeWidth={1.5}
                />
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
