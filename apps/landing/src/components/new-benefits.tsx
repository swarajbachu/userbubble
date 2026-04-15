"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Analytics02Icon,
  CodeCircleIcon,
  FingerPrintCheckIcon,
  MoneyBag01Icon,
  Shield01Icon,
  SourceCodeSquareIcon,
} from "@hugeicons-pro/core-duotone-rounded";
import type React from "react";
import { Badge } from "./badge";
import { Container } from "./container";
import { SectionHeading } from "./seciton-heading";
import { SubHeading } from "./subheading";

const benefits = [
  {
    title: "Works With Your Stack",
    description:
      "Supports React, Next.js, TypeScript, and most modern web frameworks. Understands your architecture and writes idiomatic code that matches your codebase style.",
    icon: SourceCodeSquareIcon,
  },
  {
    title: "Full Transparency",
    description:
      "Watch the AI work in real time. See exactly which files it reads, what it changes, and why. Every step is logged so you always know what happened.",
    icon: Analytics02Icon,
  },
  {
    title: "You Stay In Control",
    description:
      "Nothing merges without your approval. Every fix is a pull request you review before it touches your codebase. Approve, request changes, or pass to your dev team.",
    icon: FingerPrintCheckIcon,
  },
  {
    title: "GitHub Native",
    description:
      "Works with your existing GitHub workflow. PRs, branches, code review. No new tools to learn, no separate dashboard to check. It just works where you already work.",
    icon: CodeCircleIcon,
  },
  {
    title: "Enterprise-Grade Security",
    description:
      "Your code is never stored permanently. All communication is encrypted. We never share your code with third parties. SOC 2 compliance coming soon.",
    icon: Shield01Icon,
  },
  {
    title: "Free & Open Source",
    description:
      "No pricing tiers, no per-seat costs, no hidden fees. Completely free and open source under MIT. Self-host or use our hosted version.",
    icon: MoneyBag01Icon,
  },
];

const Card = ({
  title,
  description,
  icon,
}: {
  title: string;
  description: string;
  icon: React.ComponentType;
}) => (
  <div className="relative z-10 rounded-lg bg-gray-50 p-4 transition duration-200 hover:bg-gray-100 md:p-5 dark:bg-neutral-800 dark:hover:bg-neutral-700">
    <div className="flex items-center gap-2">
      <HugeiconsIcon
        className="text-brand"
        color="currentColor"
        icon={icon}
        size={24}
        strokeWidth={1.5}
      />
    </div>
    <h3 className="mt-4 mb-2 font-medium text-lg">{title}</h3>
    <p className="text-gray-600 dark:text-neutral-300">{description}</p>
  </div>
);

export const NewBenefits = () => (
  <Container className="relative overflow-hidden border-divide border-x px-4 py-20 md:px-8">
    <div className="relative flex flex-col items-center">
      <Badge text="Why UserBubble" />
      <SectionHeading className="mt-4">
        Built for founders who ship
      </SectionHeading>

      <SubHeading as="p" className="mx-auto mt-6 max-w-lg">
        Stop translating feedback into tickets. Let AI handle the code so you
        can focus on your product and your users.
      </SubHeading>
    </div>
    <div className="mt-16 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {benefits.map((benefit) => (
        <Card key={benefit.title} {...benefit} />
      ))}
    </div>
  </Container>
);
