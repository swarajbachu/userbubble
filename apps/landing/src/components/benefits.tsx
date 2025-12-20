"use client";
import { AnimatePresence, motion } from "motion/react";
import type React from "react";
import { useEffect, useState } from "react";
import { RealtimeSyncIcon } from "@/icons/bento-icons";
import {
  BellIcon,
  GraphIcon,
  ReuseBrainIcon,
  RocketIcon,
  ScreenCogIcon,
  ShieldIcon,
} from "@/icons/card-icons";
import { OpenAILogo, SlackLogo } from "@/icons/general";
import { Badge } from "./badge";
import { HorizontalLine } from "./common/horizontal-line";
import { IconBlock } from "./common/icon-block";
import { VerticalLine } from "./common/vertical-line";
import { Container } from "./container";
import { DivideX } from "./divide";
import { LogoSVG } from "./logo";
import { SectionHeading } from "./seciton-heading";
import { SubHeading } from "./subheading";

export const Benefits = () => {
  const benefits = [
    {
      title: "Launch Faster",
      description:
        "Visually orchestrate autonomous agents without writing boilerplate code",
      icon: <RocketIcon className="size-6 text-brand" />,
    },
    {
      title: "Iterate Rapidly",
      description:
        "Visually orchestrate autonomous agents without writing boilerplate code",
      icon: <RealtimeSyncIcon className="size-6 text-brand" />,
    },
    {
      title: "Scale Smarter",
      description:
        "Visually orchestrate autonomous agents without writing boilerplate code",
      icon: <GraphIcon className="size-6 text-brand" />,
    },
    {
      title: "Reuse Intelligence",
      description:
        "Visually orchestrate autonomous agents without writing boilerplate code",
      icon: <ReuseBrainIcon className="size-6 text-brand" />,
    },
    {
      title: "Prevent Breakdowns",
      description:
        "Visually orchestrate autonomous agents without writing boilerplate code",
      icon: <ShieldIcon className="size-6 text-brand" />,
    },
    {
      title: "Automate More",
      description:
        "Visually orchestrate autonomous agents without writing boilerplate code",
      icon: <ScreenCogIcon className="size-6 text-brand" />,
    },
  ];
  return (
    <Container className="relative overflow-hidden border-divide border-x px-4 py-20 md:px-8">
      <div className="relative flex flex-col items-center">
        <Badge text="Benefits" />
        <SectionHeading className="mt-4">
          Making Engineers 10x faster
        </SectionHeading>

        <SubHeading as="p" className="mx-auto mt-6 max-w-lg">
          We empower developers and technical teams to create, simulate, and
          manage AI-driven workflows visually
        </SubHeading>
      </div>
      <div className="mt-20 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="grid grid-cols-1 gap-4">
          {benefits.slice(0, 3).map((benefit, index) => (
            <Card key={benefit.title} {...benefit} />
          ))}
        </div>
        <MiddleCard />
        <div className="grid grid-cols-1 gap-4">
          {benefits.slice(3, 6).map((benefit, index) => (
            <Card key={benefit.title} {...benefit} />
          ))}
        </div>
      </div>
    </Container>
  );
};

const MiddleCard = () => {
  const texts = ["Meeting created", "Chat history saved", "You talking to me"];
  const [activeText, setActiveText] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveText((prev) => (prev + 1) % texts.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);
  return (
    <div className="relative flex min-h-40 flex-col justify-end overflow-hidden rounded-lg bg-gray-50 p-4 md:p-5 dark:bg-neutral-900">
      <div className="mask-radial-from-10% absolute inset-0 bg-[radial-gradient(var(--color-dots)_1px,transparent_1px)] shadow-xl [background-size:10px_10px]" />

      <div className="flex items-center justify-center">
        <IconBlock icon={<OpenAILogo className="size-6" />} />
        <HorizontalLine />
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-gray-200 p-px shadow-xl dark:bg-neutral-700">
          <div className="absolute inset-0 scale-[1.4] animate-spin rounded-full bg-conic [animation-duration:2s] [background-image:conic-gradient(at_center,transparent,var(--color-blue-500)_20%,transparent_30%)]" />
          <div className="absolute inset-0 scale-[1.4] animate-spin rounded-full bg-conic via-brand [animation-delay:1s] [animation-duration:2s] [background-image:conic-gradient(at_center,transparent,var(--color-brand)_20%,transparent_30%)]" />
          <div className="relative z-20 flex h-full w-full items-center justify-center rounded-[5px] bg-white dark:bg-neutral-900">
            <LogoSVG />
          </div>
        </div>
        <HorizontalLine />
        <IconBlock icon={<SlackLogo className="size-6" />} />
      </div>
      <div className="relative z-20 flex flex-col items-center justify-center">
        <VerticalLine />
        <div className="rounded-sm border border-blue-500 bg-blue-50 px-2 py-0.5 text-blue-500 text-xs dark:bg-blue-900 dark:text-white">
          Connected
        </div>
      </div>
      <div className="h-60 w-full translate-x-10 translate-y-10 overflow-hidden rounded-md bg-gray-200 p-px shadow-xl dark:bg-neutral-700">
        <div className="absolute inset-0 scale-[1.4] animate-spin rounded-full bg-conic from-transparent via-20% via-blue-500 to-30% to-transparent blur-2xl [animation-duration:4s]" />
        <div className="absolute inset-0 scale-[1.4] animate-spin rounded-full bg-conic from-transparent via-20% via-brand to-30% to-transparent blur-2xl [animation-delay:2s] [animation-duration:4s]" />
        <div className="relative z-20 h-full w-full rounded-[5px] bg-white dark:bg-neutral-900">
          <div className="flex items-center justify-between p-4">
            <div className="flex gap-1">
              <div className="size-2 rounded-full bg-red-400" />
              <div className="size-2 rounded-full bg-yellow-400" />
              <div className="size-2 rounded-full bg-green-400" />
            </div>
            <AnimatePresence mode="wait">
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className="mr-2 flex items-center gap-1 rounded-sm bg-white px-2 py-1 text-neutral-500 text-xs shadow-aceternity dark:bg-neutral-700 dark:text-white"
                exit={{ opacity: 0, y: 10 }}
                initial={{ opacity: 0, y: -10 }}
                key={activeText}
                transition={{ duration: 0.3 }}
              >
                <BellIcon className="size-3" />
                <motion.span key={activeText}>{texts[activeText]}</motion.span>
              </motion.div>
            </AnimatePresence>
          </div>
          <DivideX />
          <div className="flex h-full flex-row">
            <div className="h-full w-14 bg-gray-200 dark:bg-neutral-800" />
            <motion.div className="w-full gap-y-4 p-4">
              <h2 className="font-semibold text-gray-800 text-sm dark:text-neutral-300">
                Dashboard
              </h2>

              <div className="mask-b-from-50% mt-4 flex flex-col gap-y-3">
                {[
                  { label: "API Calls", width: 85 },
                  { label: "Success Rate", width: 92 },
                  { label: "Workflows", width: 65 },
                ].map((item, index) => (
                  <div className="space-y-1" key={item.label}>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-600">{item.label}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-gray-200 dark:bg-neutral-700">
                      <motion.div
                        animate={{ width: `${item.width}%` }}
                        className="h-full rounded-full bg-neutral-300 dark:bg-neutral-400"
                        initial={{ width: 0 }}
                        transition={{
                          duration: 1.2,
                          delay: 0.4 + index * 0.1,
                          ease: "easeOut",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Card = (props: {
  title: string;
  description: string;
  icon: React.ReactNode;
}) => {
  const { title, description, icon } = props;
  return (
    <div className="relative z-10 rounded-lg bg-gray-50 p-4 transition duration-200 hover:bg-transparent md:p-5 dark:bg-neutral-800">
      <div className="flex items-center gap-2">{icon}</div>
      <h3 className="mt-4 mb-2 font-medium text-lg">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};
