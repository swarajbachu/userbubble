"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  AiBeautifyIcon,
  Bug01Icon,
  SourceCodeIcon,
  TickDouble01Icon,
} from "@hugeicons-pro/core-duotone-rounded";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { Badge } from "./badge";
import { Container } from "./container";
import { SectionHeading } from "./seciton-heading";
import { SubHeading } from "./subheading";

const steps = [
  {
    icon: Bug01Icon,
    label: "User reports a bug",
    description:
      "Through your app, email, Intercom, Slack... however they reach you.",
    time: "0s",
  },
  {
    icon: SourceCodeIcon,
    label: "AI reads your codebase",
    description:
      "Understands your architecture, finds the relevant files, identifies the root cause.",
    time: "~30s",
  },
  {
    icon: AiBeautifyIcon,
    label: "PR is ready",
    description:
      "A clean pull request with the fix, explanation, and context. Ready for review.",
    time: "~4 min",
  },
  {
    icon: TickDouble01Icon,
    label: "You approve",
    description: "Review the changes. Merge when ready. You stay in control.",
    time: "~1 min",
  },
];

const terminalLines = [
  { done: true, text: "Connected to ", hl: "acme-corp/dashboard" },
  {
    done: true,
    text: "Reading feedback: ",
    hl: '"Checkout page broken on mobile Safari"',
  },
  { done: true, text: "Scanned 1,247 files in ", hl: "12 seconds" },
  {
    done: true,
    text: "Root cause found: ",
    hl: "src/components/Checkout.tsx:89",
  },
  { done: true, text: "Missing webkit prefix for ", hl: "flex-gap property" },
  { done: true, text: "Fix written: ", hl: "2 files, 7 lines changed" },
  {
    done: true,
    text: "PR #347 opened: ",
    hl: '"Fix mobile Safari checkout layout"',
  },
  { done: false, text: "Waiting for your approval.", hl: "" },
];

const TerminalWindow = () => {
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    if (visibleLines >= terminalLines.length) {
      return;
    }
    const timeout = setTimeout(
      () => setVisibleLines((prev) => prev + 1),
      visibleLines === 0 ? 500 : 400
    );
    return () => clearTimeout(timeout);
  }, [visibleLines]);

  return (
    <div className="w-full max-w-2xl overflow-hidden rounded-lg border border-divide bg-gray-50 shadow-aceternity dark:bg-neutral-900">
      {/* Header dots */}
      <div className="flex items-center gap-1.5 border-divide border-b px-4 py-2.5">
        <div className="size-2.5 rounded-full bg-red-400" />
        <div className="size-2.5 rounded-full bg-yellow-400" />
        <div className="size-2.5 rounded-full bg-green-400" />
        <span className="ml-2 font-mono text-[11px] text-neutral-400 dark:text-neutral-500">
          userbubble-agent
        </span>
      </div>
      {/* Body */}
      <div className="px-4 py-3 font-mono text-[13px] leading-7">
        <AnimatePresence>
          {terminalLines.slice(0, visibleLines).map((line, _i) => (
            <motion.div
              animate={{ opacity: 1, y: 0 }}
              className={
                line.done
                  ? "text-gray-500 dark:text-neutral-400"
                  : "text-charcoal-700 dark:text-neutral-100"
              }
              initial={{ opacity: 0, y: 4 }}
              key={line.text}
              transition={{ duration: 0.2 }}
            >
              <span className={line.done ? "text-green-500" : "text-brand"}>
                {line.done ? "\u2713 " : "\u25A0 "}
              </span>
              {line.text}
              {line.hl && <span className="text-brand">{line.hl}</span>}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
};

export const SolutionTimeline = () => (
  <Container className="border-divide border-x bg-gray-100 px-4 md:px-8 dark:bg-neutral-900">
    <div className="flex flex-col items-center py-20">
      <Badge text="The Solution" />
      <SectionHeading className="mt-4">
        What if the fix wrote itself?
      </SectionHeading>
      <SubHeading as="p" className="mx-auto mt-6 max-w-lg">
        Same user. Same bug report. But this time, UserBubble is listening.
      </SubHeading>

      <div className="mt-12 w-full max-w-xl">
        {steps.map((step, index) => (
          <motion.div
            animate={{ opacity: 1, y: 0 }}
            className="relative flex gap-4 pb-8 last:pb-0"
            initial={{ opacity: 0, y: 10 }}
            key={step.label}
            transition={{ duration: 0.4, delay: index * 0.1 }}
          >
            {index < steps.length - 1 && (
              <div className="absolute top-10 bottom-0 left-[15px] w-px bg-divide" />
            )}
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand/10">
              <HugeiconsIcon
                className="text-brand"
                color="currentColor"
                icon={step.icon}
                size={16}
                strokeWidth={1.5}
              />
            </div>
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
        ))}
      </div>

      <div className="mt-8">
        <TerminalWindow />
      </div>

      <div className="mt-8 rounded-lg border border-brand/20 bg-brand/5 px-6 py-3">
        <p className="text-center font-medium text-brand text-sm">
          Total time: 5 minutes. Same bug. Same user. Completely different
          outcome.
        </p>
      </div>
    </div>
  </Container>
);
