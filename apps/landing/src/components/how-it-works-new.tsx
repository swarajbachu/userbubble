"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  CodeCircleIcon,
  Cursor01Icon,
  MailSend01Icon,
} from "@hugeicons-pro/core-duotone-rounded";
import { motion } from "motion/react";
import { Badge } from "./badge";
import { Container } from "./container";
import { SectionHeading } from "./seciton-heading";
import { SubHeading } from "./subheading";

const steps = [
  {
    num: "01",
    title: "Connect your repo",
    description:
      "Paste your GitHub URL. One click. UserBubble reads your codebase and understands your architecture.",
    icon: CodeCircleIcon,
  },
  {
    num: "02",
    title: "Forward user feedback",
    description:
      "Bug reports, feature requests, support tickets. Paste them in or connect your feedback channels.",
    icon: MailSend01Icon,
  },
  {
    num: "03",
    title: "Approve the PR",
    description:
      "Review the AI-generated pull request. Approve it, request changes, or pass it to your dev team.",
    icon: Cursor01Icon,
  },
];

export const HowItWorksNew = () => (
  <Container className="border-divide border-x px-4 md:px-8">
    <div className="flex flex-col items-center py-20">
      <Badge text="How It Works" />
      <SectionHeading className="mt-4">Three steps. Zero code.</SectionHeading>
      <SubHeading as="p" className="mx-auto mt-6 max-w-lg">
        You don&apos;t need to be technical. You don&apos;t need to write
        tickets. You just need to connect your repo and let your users talk.
      </SubHeading>

      <div className="mt-12 grid w-full grid-cols-1 gap-4 md:grid-cols-3">
        {steps.map((step, index) => (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="relative z-10 rounded-lg bg-gray-50 p-4 transition duration-200 hover:bg-gray-100 md:p-5 dark:bg-neutral-800 dark:hover:bg-neutral-700"
            initial={{ opacity: 0, y: 10 }}
            key={step.num}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            <div className="flex items-center gap-2">
              <HugeiconsIcon
                className="text-brand"
                color="currentColor"
                icon={step.icon}
                size={24}
                strokeWidth={1.5}
              />
            </div>
            <p className="mt-3 font-mono text-brand/30 text-sm">{step.num}</p>
            <h3 className="mt-1 mb-2 font-medium text-lg">{step.title}</h3>
            <p className="text-gray-600 dark:text-neutral-300">
              {step.description}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  </Container>
);
