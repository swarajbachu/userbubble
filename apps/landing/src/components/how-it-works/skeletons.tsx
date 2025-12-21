"use client";
import { motion, type useMotionValue, useTransform } from "motion/react";
import type React from "react";
import { ForkIcon } from "@/icons/general";
import { cn } from "@/lib/utils";
import { DivideX } from "../divide";
import { LogoSVG } from "../logo";

// const WORD_SPLIT_REGEX = /(\s+)/;

export const DesignYourWorkflowSkeleton = () => (
  <motion.div
    className="relative mx-auto mt-12 h-full max-h-70 min-h-40 w-[85%] rounded-2xl border-gray-300 border-t bg-white p-6 shadow-2xl dark:border-neutral-700 dark:bg-neutral-900"
    initial={{ opacity: 0, y: 20 }}
    transition={{ duration: 0.5 }}
    viewport={{ once: true }}
    whileInView={{ opacity: 1, y: 0 }}
  >
    <div className="mb-4 flex gap-2">
      <div className="h-3 w-3 rounded-full bg-red-500" />
      <div className="h-3 w-3 rounded-full bg-yellow-500" />
      <div className="h-3 w-3 rounded-full bg-green-500" />
    </div>
    <div className="rounded-lg bg-gray-900 p-4 font-mono text-sm dark:bg-neutral-950">
      <div className="flex gap-2">
        <span className="text-green-400">$</span>
        <motion.span
          animate={{ opacity: 1 }}
          className="text-gray-300"
          initial={{ opacity: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          npm install @userbubble/react-native
        </motion.span>
      </div>
      <motion.div
        animate={{ opacity: 1 }}
        className="mt-4 text-gray-500"
        initial={{ opacity: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <div>✓ Installing dependencies...</div>
        <div className="mt-1">✓ Setup complete!</div>
      </motion.div>
    </div>
    <motion.div
      animate={{ opacity: 1 }}
      className="mt-4 rounded-lg border border-green-500/20 bg-green-50 p-3 text-green-700 text-sm dark:bg-green-950 dark:text-green-400"
      initial={{ opacity: 0 }}
      transition={{ duration: 0.5, delay: 1.2 }}
    >
      <div className="font-medium">Ready to integrate!</div>
      <div className="mt-1 text-xs">
        Import the SDK in your app to get started.
      </div>
    </motion.div>
  </motion.div>
);

export const ConnectYourTooklsSkeleton = () => (
  <motion.div
    className="relative mx-auto mt-12 h-full max-h-70 min-h-40 w-[85%] rounded-3xl border-8 border-gray-300 bg-gray-900 p-6 shadow-2xl dark:border-neutral-700"
    initial={{ opacity: 0, scale: 0.9 }}
    transition={{ duration: 0.5 }}
    viewport={{ once: true }}
    whileInView={{ opacity: 1, scale: 1 }}
  >
    <div className="relative h-full rounded-2xl bg-white p-4 dark:bg-neutral-900">
      <div className="flex items-center justify-between border-gray-200 border-b pb-3 dark:border-neutral-700">
        <div className="flex items-center gap-2">
          <LogoSVG className="size-5" />
          <span className="font-semibold text-sm">Feedback</span>
        </div>
        <div className="size-6 rounded-full bg-gray-200 dark:bg-neutral-700" />
      </div>

      <motion.div
        animate={{ opacity: 1 }}
        className="mt-4"
        initial={{ opacity: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <div className="block text-gray-700 text-sm dark:text-neutral-300">
          What would you like to see improved?
        </div>
        <motion.div
          animate={{ opacity: 1 }}
          className="mt-2 rounded-lg border border-gray-300 bg-gray-50 p-3 text-gray-600 text-sm dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
          initial={{ opacity: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <div className="h-2 w-3/4 rounded bg-gray-300 dark:bg-neutral-600" />
          <div className="mt-2 h-2 w-1/2 rounded bg-gray-300 dark:bg-neutral-600" />
        </motion.div>
      </motion.div>

      <motion.button
        animate={{ opacity: 1 }}
        className="mt-4 w-full rounded-lg bg-blue-500 py-2.5 font-medium text-sm text-white"
        initial={{ opacity: 0 }}
        transition={{ duration: 0.5, delay: 0.9 }}
        type="button"
      >
        Submit Feedback
      </motion.button>

      <motion.div
        animate={{ opacity: 1 }}
        className="mt-3 text-center text-gray-500 text-xs dark:text-neutral-500"
        initial={{ opacity: 0 }}
        transition={{ duration: 0.5, delay: 1.1 }}
      >
        Powered by UserBubble
      </motion.div>
    </div>
  </motion.div>
);

type DeployCardData = {
  title: string;
  subtitle: string;
  branch: string;
  variant?: "default" | "danger" | "success" | "warning";
};

const _AnimatedDeployCard = ({
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
  const feedbackItems = [
    { title: "Dark mode support", votes: 42, status: "Planned" },
    { title: "Export to CSV feature", votes: 28, status: "In Progress" },
    { title: "Mobile app notifications", votes: 35, status: "Planned" },
    { title: "Better search functionality", votes: 19, status: "Under Review" },
  ];

  return (
    <motion.div
      className="relative mx-auto mt-12 h-full max-h-70 min-h-40 w-[85%] rounded-2xl border-gray-300 border-t bg-white p-6 shadow-2xl dark:border-neutral-700 dark:bg-neutral-900"
      initial={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true }}
      whileInView={{ opacity: 1, y: 0 }}
    >
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">Feedback Dashboard</h3>
          <p className="text-gray-600 text-sm dark:text-neutral-400">
            All submissions in one place
          </p>
        </div>
        <div className="rounded-lg bg-blue-50 px-3 py-1 font-medium text-blue-600 text-sm dark:bg-blue-950 dark:text-blue-400">
          124 total
        </div>
      </div>

      <DivideX />

      <div className="mt-4 space-y-3">
        {feedbackItems.map((item, index) => (
          <motion.div
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-neutral-700 dark:bg-neutral-800"
            initial={{ opacity: 0, x: -20 }}
            key={item.title}
            transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
          >
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-1 rounded-md bg-white px-2 py-1 dark:bg-neutral-900">
                <div className="text-xs">▲</div>
                <div className="font-semibold text-sm">{item.votes}</div>
              </div>
              <div>
                <div className="font-medium text-sm">{item.title}</div>
                <div className="text-gray-600 text-xs dark:text-neutral-400">
                  2 hours ago
                </div>
              </div>
            </div>
            <div className="rounded-full bg-green-100 px-3 py-1 text-green-700 text-xs dark:bg-green-950 dark:text-green-400">
              {item.status}
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
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

const _LeftSVG = (props: React.SVGProps<SVGSVGElement>) => {
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

const _RightSVG = (props: React.SVGProps<SVGSVGElement>) => {
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

const _CenterSVG = (props: React.SVGProps<SVGSVGElement>) => (
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
