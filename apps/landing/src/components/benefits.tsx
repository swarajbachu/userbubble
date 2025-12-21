"use client";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Analytics02Icon,
  DashboardSquare02Icon,
  Loading03Icon,
  MobileNavigator01Icon,
  MoneyBag01Icon,
  Notification02Icon,
  Rocket01Icon,
  Settings03Icon,
  Shield01Icon,
} from "@hugeicons-pro/core-duotone-rounded";
import { AnimatePresence, motion } from "motion/react";
import type React from "react";
import { useEffect, useState } from "react";
// Logos now loaded from public/logos/
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
      title: "Built for Mobile",
      description:
        "Native SDKs for mobile platforms. React Native support available now (Expo and bare workflows). Native Swift and Kotlin SDKs coming soon.",
      icon: (
        <HugeiconsIcon
          className="text-brand"
          color="currentColor"
          icon={Shield01Icon}
          size={24}
          strokeWidth={1.5}
        />
      ),
    },
    {
      title: "5-Minute Integration",
      description:
        "One npm install and you're ready. Import the widget component and drop it anywhere in your app. No backend setup, no API keys to manage.",
      icon: (
        <HugeiconsIcon
          className="text-brand"
          color="currentColor"
          icon={Rocket01Icon}
          size={24}
          strokeWidth={1.5}
        />
      ),
    },
    {
      title: "Sub-10KB Footprint",
      description:
        "Your app stays fast. Our lightweight SDK loads in milliseconds and won't slow down your page speed scores. Lazy-loaded by default for zero performance impact.",
      icon: (
        <HugeiconsIcon
          className="text-brand"
          color="currentColor"
          icon={Analytics02Icon}
          size={24}
          strokeWidth={1.5}
        />
      ),
    },
    {
      title: "Comprehensive Documentation",
      description:
        "Step-by-step guides for mobile development. Code examples for common scenarios. Platform-specific tips for iOS and Android.",
      icon: (
        <HugeiconsIcon
          className="text-brand"
          color="currentColor"
          icon={Settings03Icon}
          size={24}
          strokeWidth={1.5}
        />
      ),
    },
    {
      title: "Per-Org Pricing",
      description:
        "As your team grows, your bill doesn't explode. Pay per organization, not per seat. Invite everyone on your team without worrying about costs.",
      icon: (
        <HugeiconsIcon
          className="text-brand"
          color="currentColor"
          icon={MoneyBag01Icon}
          size={24}
          strokeWidth={1.5}
        />
      ),
    },
    {
      title: "Mobile-First Dashboard",
      description:
        "View feedback from all your mobile users in one dashboard. Filter by platform (iOS/Android), track votes, and prioritize features that matter most.",
      icon: (
        <HugeiconsIcon
          className="text-brand"
          color="currentColor"
          icon={Loading03Icon}
          size={24}
          strokeWidth={1.5}
        />
      ),
    },
  ];
  return (
    <Container className="relative overflow-hidden border-divide border-x px-4 py-20 md:px-8">
      <div className="relative flex flex-col items-center">
        <Badge text="Benefits" />
        <SectionHeading className="mt-4">
          Built for mobile developers
        </SectionHeading>

        <SubHeading as="p" className="mx-auto mt-6 max-w-lg">
          Lightweight SDKs, comprehensive docs, and seamless integration. Get
          feedback from mobile users without disrupting your development
          workflow.
        </SubHeading>
      </div>
      <div className="mt-20 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="grid grid-cols-1 gap-4">
          {benefits.slice(0, 3).map((benefit) => (
            <Card key={benefit.title} {...benefit} />
          ))}
        </div>
        <MiddleCard />
        <div className="grid grid-cols-1 gap-4">
          {benefits.slice(3, 6).map((benefit) => (
            <Card key={benefit.title} {...benefit} />
          ))}
        </div>
      </div>
    </Container>
  );
};

const MiddleCard = () => {
  const texts = [
    "npm install complete",
    "Widget initialized",
    "Feedback received",
  ];
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
        <IconBlock
          icon={
            <HugeiconsIcon
              className="text-gray-600"
              color="currentColor"
              icon={MobileNavigator01Icon}
              size={24}
              strokeWidth={1.5}
            />
          }
        />
        <HorizontalLine />
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-gray-200 p-px shadow-xl dark:bg-neutral-700">
          <div className="absolute inset-0 scale-[1.4] animate-spin rounded-full bg-conic [animation-duration:2s] [background-image:conic-gradient(at_center,transparent,var(--color-blue-500)_20%,transparent_30%)]" />
          <div className="absolute inset-0 scale-[1.4] animate-spin rounded-full bg-conic via-brand [animation-delay:1s] [animation-duration:2s] [background-image:conic-gradient(at_center,transparent,var(--color-brand)_20%,transparent_30%)]" />
          <div className="relative z-20 flex h-full w-full items-center justify-center rounded-[5px] bg-white dark:bg-neutral-900">
            <LogoSVG />
          </div>
        </div>
        <HorizontalLine />
        <IconBlock
          icon={
            <HugeiconsIcon
              className="text-gray-600"
              color="currentColor"
              icon={DashboardSquare02Icon}
              size={24}
              strokeWidth={1.5}
            />
          }
        />
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
                <HugeiconsIcon
                  color="currentColor"
                  icon={Notification02Icon}
                  size={12}
                  strokeWidth={1.5}
                />
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
                  { label: "SDK Integration", width: 85 },
                  { label: "Widget Loaded", width: 92 },
                  { label: "Feedback Collected", width: 65 },
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
