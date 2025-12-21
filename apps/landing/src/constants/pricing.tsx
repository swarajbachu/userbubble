import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon } from "@hugeicons-pro/core-duotone-rounded";
import { CloseIcon } from "@/icons/general";

export const TierName = {
  TIER_1: "Starter",
  TIER_2: "Growth",
  TIER_3: "Enterprise",
} as const;

export type TierName = (typeof TierName)[keyof typeof TierName];

export const tiers = [
  {
    title: TierName.TIER_1,
    subtitle: "Early stage teams",
    monthly: 8,
    yearly: 80,
    ctaText: "Start building",
    ctaLink: "/sign-up",
    features: [
      "Up to 100 feedback submissions/month",
      "1 public roadmap",
      "1 changelog",
      "Community support",
      "Custom subdomain",
      "Basic analytics",
      "HMAC auto-login",
      "Email notifications",
    ],
  },
  {
    title: TierName.TIER_2,
    subtitle: "Fast moving startups",
    monthly: 12,
    yearly: 120,
    ctaText: "Start for free",
    ctaLink: "/sign-up",
    features: [
      "Up to 500 feedback submissions/month",
      "Unlimited roadmaps",
      "Unlimited changelogs",
      "Priority support",
      "3 team workspaces",
      "Advanced analytics",
      "Custom branding",
      "Slack integration",
    ],
    featured: true,
  },
  {
    title: TierName.TIER_3,
    subtitle: "Large enterprises",
    monthly: 25,
    yearly: 250,
    ctaText: "Contact sales",
    ctaLink: "/contact",
    features: [
      "Unlimited feedback submissions",
      "Unlimited workspaces",
      "Dedicated support",
      "Custom integrations",
      "API access",
      "SLA guarantee",
      "Advanced security & compliance",
      "Custom domain",
      "White-label options",
    ],
  },
];

export const pricingTable = [
  {
    title: "Feedback Submissions",
    tiers: [
      {
        title: TierName.TIER_1,
        value: "100/month",
      },
      {
        title: TierName.TIER_2,
        value: "500/month",
      },
      {
        title: TierName.TIER_3,
        value: "Unlimited",
      },
    ],
  },
  {
    title: "Public Roadmaps",
    tiers: [
      {
        title: TierName.TIER_1,
        value: "1",
      },
      {
        title: TierName.TIER_2,
        value: "Unlimited",
      },
      {
        title: TierName.TIER_3,
        value: "Unlimited",
      },
    ],
  },
  {
    title: "Changelogs",
    tiers: [
      {
        title: TierName.TIER_1,
        value: "1",
      },
      {
        title: TierName.TIER_2,
        value: "Unlimited",
      },
      {
        title: TierName.TIER_3,
        value: "Unlimited",
      },
    ],
  },
  {
    title: "HMAC Auto-Login",
    tiers: [
      {
        title: TierName.TIER_1,
        value: (
          <HugeiconsIcon
            className="mx-auto text-gray-600"
            color="currentColor"
            icon={CheckmarkCircle02Icon}
            size={20}
          />
        ),
      },
      {
        title: TierName.TIER_2,
        value: (
          <HugeiconsIcon
            className="mx-auto text-gray-600"
            color="currentColor"
            icon={CheckmarkCircle02Icon}
            size={20}
          />
        ),
      },
      {
        title: TierName.TIER_3,
        value: (
          <HugeiconsIcon
            className="mx-auto text-gray-600"
            color="currentColor"
            icon={CheckmarkCircle02Icon}
            size={20}
          />
        ),
      },
    ],
  },
  {
    title: "In-App Widget SDK",
    tiers: [
      {
        title: TierName.TIER_1,
        value: (
          <HugeiconsIcon
            className="mx-auto text-gray-600"
            color="currentColor"
            icon={CheckmarkCircle02Icon}
            size={20}
          />
        ),
      },
      {
        title: TierName.TIER_2,
        value: (
          <HugeiconsIcon
            className="mx-auto text-gray-600"
            color="currentColor"
            icon={CheckmarkCircle02Icon}
            size={20}
          />
        ),
      },
      {
        title: TierName.TIER_3,
        value: (
          <HugeiconsIcon
            className="mx-auto text-gray-600"
            color="currentColor"
            icon={CheckmarkCircle02Icon}
            size={20}
          />
        ),
      },
    ],
  },
  {
    title: "Voting & Prioritization",
    tiers: [
      {
        title: TierName.TIER_1,
        value: (
          <HugeiconsIcon
            className="mx-auto text-gray-600"
            color="currentColor"
            icon={CheckmarkCircle02Icon}
            size={20}
          />
        ),
      },
      {
        title: TierName.TIER_2,
        value: (
          <HugeiconsIcon
            className="mx-auto text-gray-600"
            color="currentColor"
            icon={CheckmarkCircle02Icon}
            size={20}
          />
        ),
      },
      {
        title: TierName.TIER_3,
        value: (
          <HugeiconsIcon
            className="mx-auto text-gray-600"
            color="currentColor"
            icon={CheckmarkCircle02Icon}
            size={20}
          />
        ),
      },
    ],
  },
  {
    title: "Team Workspaces",
    tiers: [
      {
        title: TierName.TIER_1,
        value: "1",
      },
      {
        title: TierName.TIER_2,
        value: "3",
      },
      {
        title: TierName.TIER_3,
        value: "Unlimited",
      },
    ],
  },
  {
    title: "Email Notifications",
    tiers: [
      {
        title: TierName.TIER_1,
        value: (
          <HugeiconsIcon
            className="mx-auto text-gray-600"
            color="currentColor"
            icon={CheckmarkCircle02Icon}
            size={20}
          />
        ),
      },
      {
        title: TierName.TIER_2,
        value: (
          <HugeiconsIcon
            className="mx-auto text-gray-600"
            color="currentColor"
            icon={CheckmarkCircle02Icon}
            size={20}
          />
        ),
      },
      {
        title: TierName.TIER_3,
        value: (
          <HugeiconsIcon
            className="mx-auto text-gray-600"
            color="currentColor"
            icon={CheckmarkCircle02Icon}
            size={20}
          />
        ),
      },
    ],
  },
  {
    title: "Custom Subdomain",
    tiers: [
      {
        title: TierName.TIER_1,
        value: (
          <HugeiconsIcon
            className="mx-auto text-gray-600"
            color="currentColor"
            icon={CheckmarkCircle02Icon}
            size={20}
          />
        ),
      },
      {
        title: TierName.TIER_2,
        value: (
          <HugeiconsIcon
            className="mx-auto text-gray-600"
            color="currentColor"
            icon={CheckmarkCircle02Icon}
            size={20}
          />
        ),
      },
      {
        title: TierName.TIER_3,
        value: (
          <HugeiconsIcon
            className="mx-auto text-gray-600"
            color="currentColor"
            icon={CheckmarkCircle02Icon}
            size={20}
          />
        ),
      },
    ],
  },
  {
    title: "Custom Branding",
    tiers: [
      {
        title: TierName.TIER_1,
        value: <CloseIcon className="mx-auto size-5 text-gray-600" />,
      },
      {
        title: TierName.TIER_2,
        value: (
          <HugeiconsIcon
            className="mx-auto text-gray-600"
            color="currentColor"
            icon={CheckmarkCircle02Icon}
            size={20}
          />
        ),
      },
      {
        title: TierName.TIER_3,
        value: (
          <HugeiconsIcon
            className="mx-auto text-gray-600"
            color="currentColor"
            icon={CheckmarkCircle02Icon}
            size={20}
          />
        ),
      },
    ],
  },
  {
    title: "Slack Integration",
    tiers: [
      {
        title: TierName.TIER_1,
        value: <CloseIcon className="mx-auto size-5 text-gray-600" />,
      },
      {
        title: TierName.TIER_2,
        value: (
          <HugeiconsIcon
            className="mx-auto text-gray-600"
            color="currentColor"
            icon={CheckmarkCircle02Icon}
            size={20}
          />
        ),
      },
      {
        title: TierName.TIER_3,
        value: (
          <HugeiconsIcon
            className="mx-auto text-gray-600"
            color="currentColor"
            icon={CheckmarkCircle02Icon}
            size={20}
          />
        ),
      },
    ],
  },
  {
    title: "Zapier Webhooks",
    tiers: [
      {
        title: TierName.TIER_1,
        value: <CloseIcon className="mx-auto size-5 text-gray-600" />,
      },
      {
        title: TierName.TIER_2,
        value: (
          <HugeiconsIcon
            className="mx-auto text-gray-600"
            color="currentColor"
            icon={CheckmarkCircle02Icon}
            size={20}
          />
        ),
      },
      {
        title: TierName.TIER_3,
        value: (
          <HugeiconsIcon
            className="mx-auto text-gray-600"
            color="currentColor"
            icon={CheckmarkCircle02Icon}
            size={20}
          />
        ),
      },
    ],
  },
  {
    title: "Export Data (CSV/JSON)",
    tiers: [
      {
        title: TierName.TIER_1,
        value: (
          <HugeiconsIcon
            className="mx-auto text-gray-600"
            color="currentColor"
            icon={CheckmarkCircle02Icon}
            size={20}
          />
        ),
      },
      {
        title: TierName.TIER_2,
        value: (
          <HugeiconsIcon
            className="mx-auto text-gray-600"
            color="currentColor"
            icon={CheckmarkCircle02Icon}
            size={20}
          />
        ),
      },
      {
        title: TierName.TIER_3,
        value: (
          <HugeiconsIcon
            className="mx-auto text-gray-600"
            color="currentColor"
            icon={CheckmarkCircle02Icon}
            size={20}
          />
        ),
      },
    ],
  },
  {
    title: "Advanced Analytics",
    tiers: [
      {
        title: TierName.TIER_1,
        value: <CloseIcon className="mx-auto size-5 text-gray-600" />,
      },
      {
        title: TierName.TIER_2,
        value: (
          <HugeiconsIcon
            className="mx-auto text-gray-600"
            color="currentColor"
            icon={CheckmarkCircle02Icon}
            size={20}
          />
        ),
      },
      {
        title: TierName.TIER_3,
        value: (
          <HugeiconsIcon
            className="mx-auto text-gray-600"
            color="currentColor"
            icon={CheckmarkCircle02Icon}
            size={20}
          />
        ),
      },
    ],
  },
  {
    title: "API Access",
    tiers: [
      {
        title: TierName.TIER_1,
        value: <CloseIcon className="mx-auto size-5 text-gray-600" />,
      },
      {
        title: TierName.TIER_2,
        value: <CloseIcon className="mx-auto size-5 text-gray-600" />,
      },
      {
        title: TierName.TIER_3,
        value: (
          <HugeiconsIcon
            className="mx-auto text-gray-600"
            color="currentColor"
            icon={CheckmarkCircle02Icon}
            size={20}
          />
        ),
      },
    ],
  },
  {
    title: "Custom Domain",
    tiers: [
      {
        title: TierName.TIER_1,
        value: <CloseIcon className="mx-auto size-5 text-gray-600" />,
      },
      {
        title: TierName.TIER_2,
        value: <CloseIcon className="mx-auto size-5 text-gray-600" />,
      },
      {
        title: TierName.TIER_3,
        value: (
          <HugeiconsIcon
            className="mx-auto text-gray-600"
            color="currentColor"
            icon={CheckmarkCircle02Icon}
            size={20}
          />
        ),
      },
    ],
  },
  {
    title: "White-Label Options",
    tiers: [
      {
        title: TierName.TIER_1,
        value: <CloseIcon className="mx-auto size-5 text-gray-600" />,
      },
      {
        title: TierName.TIER_2,
        value: <CloseIcon className="mx-auto size-5 text-gray-600" />,
      },
      {
        title: TierName.TIER_3,
        value: (
          <HugeiconsIcon
            className="mx-auto text-gray-600"
            color="currentColor"
            icon={CheckmarkCircle02Icon}
            size={20}
          />
        ),
      },
    ],
  },
  {
    title: "SLA Guarantee",
    tiers: [
      {
        title: TierName.TIER_1,
        value: <CloseIcon className="mx-auto size-5 text-gray-600" />,
      },
      {
        title: TierName.TIER_2,
        value: <CloseIcon className="mx-auto size-5 text-gray-600" />,
      },
      {
        title: TierName.TIER_3,
        value: (
          <HugeiconsIcon
            className="mx-auto text-gray-600"
            color="currentColor"
            icon={CheckmarkCircle02Icon}
            size={20}
          />
        ),
      },
    ],
  },
];
