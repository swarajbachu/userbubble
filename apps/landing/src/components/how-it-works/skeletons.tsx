"use client";
import { motion, useMotionValue, useTransform } from "motion/react";
import type React from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import { IntegrationsLogo } from "@/icons/bento-icons";
import {
  AnthropicLogo,
  ForkIcon,
  MetaLogo,
  OpenAILogo,
  SlackLogo,
} from "@/icons/general";
import { cn } from "@/lib/utils";
import { DivideX } from "../divide";
import { LogoSVG } from "../logo";
import { Scale } from "../scale";
import { Card } from "../tech-card";

const WORD_SPLIT_REGEX = /(\s+)/;

export const DesignYourWorkflowSkeleton = () => (
  <div className="mt-12 flex flex-col items-center">
    <div className="relative">
      <Card
        cta="Connected"
        logo={<SlackLogo />}
        subtitle="#standups"
        title="Slack"
        tone="default"
      />
      <LeftSVG className="-left-32 absolute top-12" />
      <RightSVG className="-right-32 absolute top-12" />
      <CenterSVG className="absolute top-24 right-[107px]" />
    </div>

    <div className="mt-12 flex flex-row gap-4.5">
      <Card
        cta="UI Generator"
        delay={0.2}
        logo={<AnthropicLogo />}
        subtitle="Claude 4"
        title="Anthropic"
        tone="danger"
      />
      <Card
        cta="Text Generator"
        delay={0.4}
        logo={<MetaLogo />}
        subtitle="Llama 2"
        title="Meta"
        tone="default"
      />
      <Card
        cta="Code Generator"
        delay={0.6}
        logo={<OpenAILogo />}
        subtitle="GPT-5"
        title="OpenAI"
        tone="success"
      />
    </div>
  </div>
);

export const ConnectYourTooklsSkeleton = () => {
  const text =
    "Write the first and second rule of it using Claude and ChatGPT.";
  const [mounted, setMounted] = useState(false);
  const randomWidth = useMemo(() => Math.random() * 100, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="relative flex h-full w-full items-center justify-between">
      <motion.div
        animate={{ y: 0, opacity: 1 }}
        className="-translate-x-2 relative h-70 w-60 rounded-2xl border-gray-300 border-t bg-white p-4 shadow-2xl md:translate-x-0 dark:border-neutral-700 dark:bg-neutral-900"
        initial={{ y: -20, opacity: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="-top-4 -right-4 absolute flex h-14 w-14 items-center justify-center rounded-lg bg-white shadow-xl">
          <Scale />
          <OpenAILogo className="relative z-20 h-8 w-8" />
        </div>
        <div className="mt-12 flex items-center gap-2">
          <IntegrationsLogo />
          <span className="font-medium text-charcoal-700 text-sm dark:text-neutral-200">
            Tasks
          </span>
        </div>
        <DivideX className="mt-2" />

        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-normal text-[10px] text-charcoal-700 leading-loose md:text-xs dark:text-neutral-200">
              {text.split(WORD_SPLIT_REGEX).map((word, index) => (
                <motion.span
                  animate={{
                    opacity: 1,
                  }}
                  className="inline-block"
                  initial={{
                    opacity: 0,
                  }}
                  key={index}
                  transition={{
                    duration: 0.2,
                    delay: index * 0.02,
                    ease: "linear",
                  }}
                >
                  {word === " " ? "\u00A0" : word}
                </motion.span>
              ))}
            </span>
          </div>
        </div>
        <div className="mt-2 flex flex-col">
          {[...new Array(2)].map((_, index) => (
            <motion.div
              animate={{
                width: `${randomWidth}%`,
              }}
              className="mt-2 h-4 w-full rounded-full bg-gray-200 dark:bg-neutral-800"
              initial={{
                width: "0%",
              }}
              key={`width-bar-right-${index}`}
              transition={{
                duration: 4,
                delay: index * 0.2,
                ease: "easeInOut",
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
              }}
            />
          ))}
        </div>
      </motion.div>

      <motion.div
        animate={{ opacity: 1 }}
        className="absolute inset-x-0 z-30 hidden items-center justify-center md:flex"
        initial={{ opacity: 0 }}
        transition={{ duration: 1, delay: 1 }}
      >
        <div className="size-3 rounded-full border-2 border-blue-500 bg-white dark:bg-neutral-800" />
        <div className="h-[2px] w-38 bg-blue-500" />
        <div className="size-3 rounded-full border-2 border-blue-500 bg-white dark:bg-neutral-800" />
      </motion.div>
      <motion.div
        animate={{ y: 0, opacity: 1 }}
        className="relative h-70 w-60 translate-x-10 rounded-2xl border-gray-300 border-t bg-white p-4 shadow-2xl md:translate-x-0 dark:border-neutral-700 dark:bg-neutral-900"
        initial={{ y: -20, opacity: 0 }}
        transition={{ duration: 0.5, delay: 1 }}
      >
        <div className="-top-4 -left-4 absolute flex h-14 w-14 items-center justify-center rounded-lg bg-white shadow-xl dark:bg-neutral-800">
          <Scale />
          <LogoSVG className="relative z-20 h-8 w-8" />
        </div>
        <div className="mt-12 flex items-center gap-2">
          <IntegrationsLogo className="dark:text-neutral-200" />
          <span className="font-medium text-charcoal-700 text-xs md:text-sm dark:text-neutral-200">
            Integrations
          </span>
          <span className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-0.5 text-charcoal-700 text-xs dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200">
            200
          </span>
        </div>
        <DivideX className="mt-2" />
        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <OpenAILogo className="h-4 w-4 shrink-0" />
            <span className="font-medium text-charcoal-700 text-xs md:text-sm dark:text-neutral-200">
              ChatGPT
            </span>
          </div>

          <div className="rounded-sm border border-blue-500 bg-blue-50 px-2 py-0.5 text-blue-500 text-xs">
            Connected
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AnthropicLogo className="h-4 w-4 shrink-0" />
            <span className="font-medium text-charcoal-700 text-xs md:text-sm dark:text-neutral-200">
              Claude 4 Opus
            </span>
          </div>

          <div className="rounded-sm border border-blue-500 bg-blue-50 px-2 py-0.5 text-blue-500 text-xs">
            Connected
          </div>
        </div>
        <div className="mt-2 flex flex-col">
          {[...new Array(3)].map((_, index) => (
            <motion.div
              animate={{
                width: `${70 + Math.random() * 30}%`,
              }}
              className="mt-2 h-4 w-full rounded-full bg-gray-200 dark:bg-neutral-800"
              initial={{
                width: `${20 + Math.random() * 20}%`,
              }}
              key={`width-bar-right-${index}`}
              transition={{
                duration: 4,
                delay: index * 0.2,
                ease: "easeInOut",
                repeat: Number.POSITIVE_INFINITY,
                repeatType: "reverse",
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

type DeployCardData = {
  title: string;
  subtitle: string;
  branch: string;
  variant?: "default" | "danger" | "success" | "warning";
};

const AnimatedDeployCard = ({
  card,
  index,
  y,
  offset,
  itemHeight,
}: {
  card: DeployCardData;
  index: number;
  y: ReturnType<typeof useMotionValue<number>>;
  offset: number;
  itemHeight: number;
}) => {
  const scale = useTransform(
    y,
    [
      offset + (index - 2) * -itemHeight,
      offset + (index - 1) * -itemHeight,
      offset + index * -itemHeight,
      offset + (index + 1) * -itemHeight,
      offset + (index + 2) * -itemHeight,
    ],
    [0.85, 0.95, 1.1, 0.95, 0.85]
  );

  const background = useTransform(
    y,
    [
      offset + (index - 1) * -itemHeight,
      offset + index * -itemHeight,
      offset + (index + 1) * -itemHeight,
    ],
    ["#FFFFFF", "#f17463", "#FFFFFF"]
  );

  const borderColor = useTransform(
    y,
    [
      offset + (index - 1) * -itemHeight,
      offset + index * -itemHeight,
      offset + (index + 1) * -itemHeight,
    ],
    ["#FFFFFF", "#f17463", "#FFFFFF"]
  );

  return (
    <motion.div
      className="mx-auto mt-4 w-full max-w-sm shrink-0 rounded-2xl shadow-xl"
      key={`${index}-${card.title}`}
      style={{
        scale,
        background,
        borderColor,
      }}
    >
      <DeployCard
        branch={card.branch}
        subtitle={card.subtitle}
        title={card.title}
        variant={card.variant}
      />
    </motion.div>
  );
};

export const DeployAndScaleSkeleton = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState(0);

  // Define deploy cards data for reusability
  const deployCards: DeployCardData[] = [
    { title: "deploy-dev-eu-324", subtitle: "2h ago", branch: "master" },
    {
      title: "deploy-prod-eu-128",
      subtitle: "10m ago",
      branch: "main",
      variant: "success",
    },
    {
      title: "deploy-dev-us-445",
      subtitle: "45m ago",
      branch: "feature/auth",
    },
    {
      title: "deploy-prod-ap-223",
      subtitle: "1h ago",
      branch: "main",
      variant: "success",
    },
    {
      title: "deploy-dev-eu-891",
      subtitle: "2h ago",
      branch: "fix/cache",
      variant: "warning",
    },
    {
      title: "deploy-prod-us-337",
      subtitle: "3h ago",
      branch: "main",
      variant: "success",
    },
    {
      title: "deploy-dev-ap-556",
      subtitle: "4h ago",
      branch: "feat/api",
      variant: "danger",
    },
    {
      title: "deploy-dev-eu-672",
      subtitle: "5h ago",
      branch: "feat/search",
      variant: "default",
    },
    {
      title: "deploy-prod-ap-445",
      subtitle: "6h ago",
      branch: "main",
      variant: "success",
    },
    {
      title: "deploy-dev-us-891",
      subtitle: "7h ago",
      branch: "fix/perf",
      variant: "warning",
    },
    {
      title: "deploy-prod-eu-223",
      subtitle: "8h ago",
      branch: "main",
      variant: "success",
    },
    {
      title: "deploy-dev-ap-337",
      subtitle: "9h ago",
      branch: "feat/analytics",
      variant: "default",
    },
  ];

  const extendedCards = [...deployCards, ...deployCards, ...deployCards];

  const cardHeight = 64;
  const gap = 4;
  const itemHeight = cardHeight + gap;
  const offset = (containerHeight - cardHeight) / 2;

  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      const height = entries[0]?.contentRect.height ?? 0;
      setContainerHeight(height);
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const y = useMotionValue(0);
  const totalHeight = extendedCards.length * itemHeight;

  useEffect(() => {
    let animationFrame: number;
    let lastTime = performance.now();
    const speed = 30;

    function animateScroll(now: number) {
      const elapsed = (now - lastTime) / 1000;
      lastTime = now;
      let current = y.get();
      current -= speed * elapsed;

      if (Math.abs(current) >= totalHeight / 3) {
        current += totalHeight / 3;
      }
      y.set(current);
      animationFrame = requestAnimationFrame(animateScroll);
    }
    animationFrame = requestAnimationFrame(animateScroll);
    return () => cancelAnimationFrame(animationFrame);
  }, [y, totalHeight]);

  return (
    <div
      className="relative h-full w-full overflow-hidden"
      ref={containerRef}
      style={{
        maskImage:
          "linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%)",
      }}
    >
      <motion.div
        className="-translate-x-1/2 absolute left-1/2 flex w-full flex-col items-center"
        style={{ y }}
      >
        {extendedCards.map((card, index) => (
          <AnimatedDeployCard
            card={card}
            index={index}
            itemHeight={itemHeight}
            key={`${index}-${card.title}`}
            offset={offset}
            y={y}
          />
        ))}
      </motion.div>
    </div>
  );
};

const DeployCard = ({
  variant = "default",
  title,
  subtitle,
  branch,
}: {
  variant?: "default" | "danger" | "success" | "warning";
  title: string;
  subtitle: string;
  branch: string;
}) => (
  <div className="mx-auto flex w-full max-w-sm items-center justify-between rounded-lg p-3">
    <div className="flex items-center gap-2">
      <div
        className={cn(
          "flex h-6 w-6 items-center justify-center rounded-md",
          variant === "default" && "bg-gray-200",
          variant === "danger" && "bg-red-200",
          variant === "success" && "bg-green-200",
          variant === "warning" && "bg-yellow-200"
        )}
      >
        <ForkIcon
          className={cn(
            "h-4 w-4",
            variant === "default" && "text-gray-500",
            variant === "danger" && "text-red-500",
            variant === "success" && "text-green-500",
            variant === "warning" && "text-yellow-500"
          )}
        />
      </div>
      <span className="font-medium text-charcoal-700 text-xs sm:text-sm">
        {title}
      </span>
    </div>
    <div className="ml-2 flex flex-row items-center gap-2">
      <span className="font-normal text-charcoal-700 text-xs">{subtitle}</span>
      <div className="size-1 rounded-full bg-gray-400" />
      <span className="font-normal text-charcoal-700 text-xs">{branch}</span>
    </div>
  </div>
);

const LeftSVG = (props: React.SVGProps<SVGSVGElement>) => {
  const _path =
    "M127.457 0.0891113L127.576 95.9138L127.457 0.0891113ZM-0.0609919 96.0731L-0.160632 16.2484C-0.172351 6.85959 7.4293 -0.761068 16.8181 -0.772787L16.8206 1.22721C8.53637 1.23755 1.82903 7.96166 1.83937 16.2459L1.93901 96.0706L-0.0609919 96.0731ZM-0.160632 16.2484C-0.172351 6.85959 7.4293 -0.761068 16.8181 -0.772787L127.455 -0.910888L127.458 1.08911L16.8206 1.22721C8.53637 1.23755 1.82903 7.96166 1.83937 16.2459L-0.160632 16.2484ZM127.576 95.9138L0.939007 96.0718L127.576 95.9138Z";
  return (
    <motion.svg
      animate={{
        opacity: 1,
      }}
      className={props.className}
      fill="none"
      height="97"
      initial={{
        opacity: 0,
      }}
      transition={{
        duration: 1,
      }}
      viewBox="0 0 128 97"
      width="128"
      xmlns="http://www.w3.org/2000/svg"
    >
      <mask fill="var(--color-line)" id="path-1-inside-1_557_1106">
        <path d="M127.457 0.0891113L127.576 95.9138L0.939007 96.0718L0.839368 16.2472C0.828338 7.41063 7.98283 0.238242 16.8194 0.227212L127.457 0.0891113Z" />
      </mask>
      <path
        d="M127.457 0.0891113L127.576 95.9138L127.457 0.0891113ZM-0.0609919 96.0731L-0.160632 16.2484C-0.172351 6.85959 7.4293 -0.761068 16.8181 -0.772787L16.8206 1.22721C8.53637 1.23755 1.82903 7.96166 1.83937 16.2459L1.93901 96.0706L-0.0609919 96.0731ZM-0.160632 16.2484C-0.172351 6.85959 7.4293 -0.761068 16.8181 -0.772787L127.455 -0.910888L127.458 1.08911L16.8206 1.22721C8.53637 1.23755 1.82903 7.96166 1.83937 16.2459L-0.160632 16.2484ZM127.576 95.9138L0.939007 96.0718L127.576 95.9138Z"
        fill="#EAEDF1"
        mask="url(#path-1-inside-1_557_1106)"
      />
      <path
        d="M127.457 0.0891113L127.576 95.9138L127.457 0.0891113ZM-0.0609919 96.0731L-0.160632 16.2484C-0.172351 6.85959 7.4293 -0.761068 16.8181 -0.772787L16.8206 1.22721C8.53637 1.23755 1.82903 7.96166 1.83937 16.2459L1.93901 96.0706L-0.0609919 96.0731ZM-0.160632 16.2484C-0.172351 6.85959 7.4293 -0.761068 16.8181 -0.772787L127.455 -0.910888L127.458 1.08911L16.8206 1.22721C8.53637 1.23755 1.82903 7.96166 1.83937 16.2459L-0.160632 16.2484ZM127.576 95.9138L0.939007 96.0718L127.576 95.9138Z"
        fill="url(#gradient-one)"
        mask="url(#path-1-inside-1_557_1106)"
      />
      {/* <rect d={path} width="128" height="97" fill="url(#gradient-one)" /> */}
      <defs>
        <motion.linearGradient
          animate={{
            x1: "20%",
            x2: "0%",
            y1: "90%",
            y2: "220%",
          }}
          gradientUnits="userSpaceOnUse"
          id="gradient-one"
          initial={{
            x1: "100%",
            x2: "90%",
            y1: "90%",
            y2: "80%",
          }}
          transition={{
            duration: 5,
            repeat: Number.POSITIVE_INFINITY,
            repeatDelay: 2,
          }}
        >
          <stop offset="0" stopColor="var(--color-line)" stopOpacity="0.5" />
          <stop offset="0.5" stopColor="#5787FF" stopOpacity="1" />
          <stop offset="1" stopColor="var(--color-line)" stopOpacity="0" />
        </motion.linearGradient>
      </defs>
    </motion.svg>
  );
};

const RightSVG = (props: React.SVGProps<SVGSVGElement>) => {
  const _PATH =
    "M0.619629 0L0.500018 95.8247L0.619629 0ZM128.137 95.984L128.237 16.1593C128.249 6.77047 120.647 -0.850179 111.258 -0.861898L111.256 1.1381C119.54 1.14844 126.247 7.87255 126.237 16.1568L126.137 95.9815L128.137 95.984ZM128.237 16.1593C128.249 6.77047 120.647 -0.850179 111.258 -0.861898L0.620877 -0.999999L0.618381 0.999999L111.256 1.1381C119.54 1.14844 126.247 7.87255 126.237 16.1568L128.237 16.1593ZM0.500018 95.8247L127.137 95.9827L0.500018 95.8247Z";
  return (
    <motion.svg
      animate={{
        opacity: 1,
      }}
      className={props.className}
      fill="none"
      height="96"
      initial={{
        opacity: 0,
      }}
      transition={{
        duration: 1,
      }}
      viewBox="0 0 128 96"
      width="128"
      xmlns="http://www.w3.org/2000/svg"
    >
      <mask fill="var(--color-line)" id="path-1-inside-1_557_1107">
        <path d="M0.619629 0L0.500018 95.8247L127.137 95.9827L127.237 16.1581C127.248 7.32152 120.093 0.149131 111.257 0.138101L0.619629 0Z" />
      </mask>
      <path
        d="M0.619629 0L0.500018 95.8247L0.619629 0ZM128.137 95.984L128.237 16.1593C128.249 6.77047 120.647 -0.850179 111.258 -0.861898L111.256 1.1381C119.54 1.14844 126.247 7.87255 126.237 16.1568L126.137 95.9815L128.137 95.984ZM128.237 16.1593C128.249 6.77047 120.647 -0.850179 111.258 -0.861898L0.620877 -0.999999L0.618381 0.999999L111.256 1.1381C119.54 1.14844 126.247 7.87255 126.237 16.1568L128.237 16.1593ZM0.500018 95.8247L127.137 95.9827L0.500018 95.8247Z"
        fill="#EAEDF1"
        mask="url(#path-1-inside-1_557_1107)"
      />
      <path
        d="M0.619629 0L0.500018 95.8247L0.619629 0ZM128.137 95.984L128.237 16.1593C128.249 6.77047 120.647 -0.850179 111.258 -0.861898L111.256 1.1381C119.54 1.14844 126.247 7.87255 126.237 16.1568L126.137 95.9815L128.137 95.984ZM128.237 16.1593C128.249 6.77047 120.647 -0.850179 111.258 -0.861898L0.620877 -0.999999L0.618381 0.999999L111.256 1.1381C119.54 1.14844 126.247 7.87255 126.237 16.1568L128.237 16.1593ZM0.500018 95.8247L127.137 95.9827L0.500018 95.8247Z"
        fill="url(#gradient-two)"
        mask="url(#path-1-inside-1_557_1107)"
      />
      {/* <rect d={PATH} width="128" height="97" fill="url(#gradient-two)" /> */}

      <defs>
        <motion.linearGradient
          animate={{
            x1: "100%",
            x2: "110%",
            y1: "110%",
            y2: "140%",
          }}
          gradientUnits="userSpaceOnUse"
          id="gradient-two"
          initial={{
            x1: "-10%",
            x2: "0%",
            y1: "0%",
            y2: "0%",
          }}
          transition={{
            duration: 5,
            repeat: Number.POSITIVE_INFINITY,
            repeatDelay: 2,
          }}
        >
          <stop offset="0" stopColor="white" stopOpacity="0.5" />
          <stop offset="0.5" stopColor="#F17463" stopOpacity="1" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </motion.linearGradient>
      </defs>
    </motion.svg>
  );
};

const CenterSVG = (props: React.SVGProps<SVGSVGElement>) => (
  <motion.svg
    animate={{
      opacity: 1,
    }}
    className={props.className}
    fill="none"
    height="56"
    initial={{
      opacity: 0,
    }}
    transition={{
      duration: 1,
    }}
    viewBox="0 0 2 56"
    width="2"
    xmlns="http://www.w3.org/2000/svg"
  >
    <line stroke="var(--color-line)" strokeWidth="2" x1="1" x2="1" y1="56" />
    <line stroke="url(#gradient-three)" strokeWidth="1" x1="1" x2="1" y1="56" />
    <defs>
      <motion.linearGradient
        animate={{
          x1: "0%",
          x2: "0%",
          y1: "90%",
          y2: "100%",
        }}
        gradientUnits="userSpaceOnUse"
        id="gradient-three"
        initial={{
          x1: "0%",
          x2: "0%",
          y1: "-100%",
          y2: "-90%",
        }}
        transition={{
          duration: 5,
          repeat: Number.POSITIVE_INFINITY,
          repeatDelay: 2,
        }}
      >
        <stop offset="0" stopColor="var(--color-line)" stopOpacity="1" />
        <stop offset="0.5" stopColor="#F17463" stopOpacity="0.5" />
        <stop offset="1" stopColor="#F17463" stopOpacity="0" />
      </motion.linearGradient>
    </defs>
  </motion.svg>
);
