"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Alert02Icon,
  Clock01Icon,
  Edit02Icon,
  Loading03Icon,
  TickDouble01Icon,
} from "@hugeicons-pro/core-duotone-rounded";
import { motion } from "motion/react";
import { Badge } from "./badge";
import { Container } from "./container";
import { SectionHeading } from "./seciton-heading";
import { SubHeading } from "./subheading";

const steps = [
  {
    icon: Alert02Icon,
    label: "User reports a bug",
    description:
      "An email, a support ticket, a Slack message. The user tells you something is broken.",
    time: "Instant",
  },
  {
    icon: Edit02Icon,
    label: "You write a ticket",
    description:
      "Translate the user's words into something a developer can act on. Hope you got the details right.",
    time: "~20 min",
  },
  {
    icon: Clock01Icon,
    label: "Ticket sits in the backlog",
    description:
      "Your dev team is mid-sprint. The ticket waits. The user waits. Maybe they leave.",
    time: "1-3 days",
  },
  {
    icon: Loading03Icon,
    label: "Developer picks it up",
    description:
      "They read your ticket. They have questions. They ping you on Slack. Context is already stale.",
    time: "~30 min",
  },
  {
    icon: TickDouble01Icon,
    label: "Fix ships",
    description: "Code review, QA, deploy. The user's bug is finally fixed.",
    time: "1-2 days",
  },
];

const StepCard = ({
  step,
  index,
}: {
  step: (typeof steps)[number];
  index: number;
}) => (
  <motion.div
    animate={{ opacity: 1, y: 0 }}
    className="relative flex gap-4 pb-8 last:pb-0"
    initial={{ opacity: 0, y: 10 }}
    transition={{ duration: 0.4, delay: index * 0.1 }}
  >
    {/* Vertical connector */}
    {index < steps.length - 1 && (
      <div className="absolute top-10 bottom-0 left-[15px] w-px bg-divide" />
    )}
    {/* Icon */}
    <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/30">
      <HugeiconsIcon
        className="text-red-500"
        color="currentColor"
        icon={step.icon}
        size={16}
        strokeWidth={1.5}
      />
    </div>
    {/* Content */}
    <div className="flex-1">
      <div className="flex items-baseline justify-between gap-2">
        <h4 className="font-medium text-charcoal-700 dark:text-neutral-100">
          {step.label}
        </h4>
        <span className="shrink-0 font-mono text-neutral-400 text-xs dark:text-neutral-500">
          {step.time}
        </span>
      </div>
      <p className="mt-1 text-gray-600 text-sm dark:text-neutral-300">
        {step.description}
      </p>
    </div>
  </motion.div>
);

export const ProblemTimeline = () => (
  <Container className="border-divide border-x px-4 md:px-8">
    <div className="flex flex-col items-center py-20">
      <Badge text="The Problem" />
      <SectionHeading className="mt-4">The feedback bottleneck</SectionHeading>
      <SubHeading as="p" className="mx-auto mt-6 max-w-lg">
        A user emails you: &ldquo;The checkout page is broken on mobile.&rdquo;
        You know it&apos;s important. But what happens next?
      </SubHeading>

      <div className="mt-12 w-full max-w-xl">
        {steps.map((step, index) => (
          <StepCard index={index} key={step.label} step={step} />
        ))}
      </div>

      <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-6 py-3 dark:border-red-800/30 dark:bg-red-950/20">
        <p className="text-center font-medium text-red-600 text-sm dark:text-red-400">
          Total time: 3-5 days. For a bug your user told you about in one
          sentence.
        </p>
      </div>
    </div>
  </Container>
);
