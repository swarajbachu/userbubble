/** biome-ignore-all lint/correctness/useImageSize: logo images are SVGs with responsive sizes */
/** biome-ignore-all lint/performance/noImgElement: using img for animated SDK logos with motion */
"use client";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Attachment01Icon,
  Rocket01Icon,
} from "@hugeicons-pro/core-duotone-rounded";
import { motion } from "motion/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useTypewriter } from "@/hooks/use-typewriter";
import { cn } from "@/lib/utils";
import { DivideX } from "../divide";
import { LogoSVG } from "../logo";

export const LLMModelSelectorSkeleton = () => {
  const models = [
    {
      name: "React Native",
      logo: "/logos/frameworks/react.svg",
      status: "Installed",
      variant: "success",
    },
    {
      name: "Swift (iOS)",
      logo: "/logos/frameworks/swift.svg",
      status: "Coming Soon",
      variant: "warning",
    },
    {
      name: "Kotlin (Android)",
      logo: "/logos/frameworks/react.svg",
      status: "Coming Soon",
      variant: "warning",
    },
  ];
  return (
    <motion.div className="relative mx-auto mt-20 h-full max-h-70 min-h-40 w-[85%] rounded-2xl border-gray-300 border-t bg-white p-4 shadow-2xl dark:border-neutral-700 dark:bg-neutral-800">
      <motion.div
        className="-top-10 -right-10 absolute z-20 flex w-40 shrink-0 flex-col items-start rounded-lg bg-white text-xs shadow-aceternity dark:bg-neutral-900"
        initial={{ opacity: 0 }}
        transition={{ duration: 1, delay: 1.5 }}
        viewport={{ once: true }}
        whileInView={{ opacity: 1 }}
      >
        <div className="flex w-full items-center justify-between p-2">
          <div className="flex items-center gap-2 font-medium">
            <img
              alt="React Native"
              className="h-4 w-4"
              src="/logos/frameworks/react.svg"
            />
            React Native
          </div>
          <p className="font-mono text-gray-600">v2.0</p>
        </div>
        <DivideX />
        <div className="m-2 rounded-sm border border-blue-500 bg-blue-50 px-2 py-0.5 text-blue-500 dark:bg-blue-50/10">
          Installed
        </div>
      </motion.div>
      <div className="mb-4 flex gap-2">
        <div className="h-3 w-3 rounded-full bg-red-500" />
        <div className="h-3 w-3 rounded-full bg-yellow-500" />
        <div className="h-3 w-3 rounded-full bg-green-500" />
      </div>
      <div className="mt-12 flex items-center gap-2">
        <img
          alt="React"
          className="h-4 w-4"
          src="/logos/frameworks/react.svg"
        />
        <span className="font-medium text-charcoal-700 text-sm dark:text-neutral-200">
          Mobile SDKs
        </span>
        <span className="rounded-lg border border-gray-200 bg-gray-50 px-2 py-0.5 text-charcoal-700 text-xs dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-200">
          3
        </span>
      </div>
      <DivideX className="mt-2" />
      {models.map((model, index) => (
        <div className="relative" key={model.name + index}>
          <motion.div
            className="mt-4 flex items-center justify-between gap-2"
            initial={{ clipPath: "inset(0 100% 0 0)", filter: "blur(10px)" }}
            key={model.name + index}
            transition={{
              duration: 1,
              delay: index * 1,
              ease: "easeInOut",
            }}
            viewport={{ once: true }}
            whileInView={{ clipPath: "inset(0 0% 0 0)", filter: "blur(0px)" }}
          >
            <div className="flex items-center gap-2">
              <img
                alt={model.name}
                className="h-4 w-4 shrink-0"
                src={model.logo}
              />
              <span className="font-medium text-charcoal-700 text-sm dark:text-neutral-200">
                {model.name}
              </span>
            </div>

            <div
              className={cn(
                "rounded-sm border px-2 py-0.5 text-xs",
                model.variant === "success" &&
                  "border-emerald-500 bg-emerald-50 text-emerald-500 dark:bg-emerald-50/10",
                model.variant === "warning" &&
                  "border-yellow-500 bg-yellow-50 text-yellow-500 dark:bg-yellow-50/10",
                model.variant === "danger" &&
                  "border-red-500 bg-red-50 text-red-500 dark:bg-red-50/10"
              )}
            >
              {model.status}
            </div>
          </motion.div>
          <motion.div
            className="absolute inset-y-0 left-0 h-full w-[2px] bg-gradient-to-t from-transparent via-blue-500 to-transparent"
            initial={{
              left: 0,
              opacity: 0,
            }}
            transition={{
              left: {
                duration: 1,
                delay: index * 1,
                ease: "easeInOut",
              },
              opacity: {
                duration: 1,
                delay: index * 1,
                ease: "easeInOut",
              },
            }}
            viewport={{ once: true }}
            whileInView={{
              left: "100%",
              opacity: [0, 1, 1, 1, 0],
            }}
          >
            {Array.from({ length: 8 }).map((_, sparkleIndex) => {
              const randomX = Math.random() * 100 - 50;
              const randomY = Math.random() * 100 - 50;
              const randomDelay = Math.random() * 0.8;
              const randomDuration = 0.5 + Math.random() * 1;
              const randomScale = 0.5 + Math.random() * 0.5;

              return (
                <motion.div
                  className="absolute top-1/2 left-1/2 h-1 w-1 text-blue-400 text-xs"
                  initial={{
                    opacity: 0,
                    scale: 0,
                    x: 0,
                    y: 0,
                  }}
                  key={sparkleIndex}
                  transition={{
                    duration: randomDuration,
                    delay: index * 1 + randomDelay,
                    ease: "easeOut",
                  }}
                  viewport={{ once: true }}
                  whileInView={{
                    opacity: [0, 1, 0],
                    scale: [0, randomScale, 0],
                    x: randomX,
                    y: randomY,
                    rotate: [0, 360],
                  }}
                >
                  ✨
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      ))}
    </motion.div>
  );
};

const TYPING_SPEED = 30;

export const TextToWorkflowBuilderSkeleton = () => {
  const initialChat = [
    {
      role: "user",
      content: "Dark mode toggle would be nice",
    },
    {
      role: "assistant",
      content: "Thanks for the feedback! We've added this to our roadmap.",
    },
    {
      role: "user",
      content: "Export feature for reports would help our team a lot",
    },
    {
      role: "assistant",
      content: "Great suggestion! This is now planned for Q2.",
    },
  ];

  const [chat, setChat] = useState(initialChat);
  const [inputText, setInputText] = useState("");
  const [visibleMessages, setVisibleMessages] = useState(0);
  const [currentMessageComplete, setCurrentMessageComplete] = useState(false);
  const [chatContainerRef, setChatContainerRef] =
    useState<HTMLDivElement | null>(null);

  const INITIAL_DELAY = 200;
  const MESSAGE_DELAY = 400;
  const RANDOM_MESSAGES = [
    "Thanks for your feedback! We're reviewing this.",
    "Great idea! This has been added to our backlog.",
    "We're prioritizing this feature based on votes.",
    "Your feedback helps us build a better product.",
    "This is now being tracked on our public roadmap.",
    "We'll notify you when this ships!",
  ];

  const handleSendMessage = () => {
    if (inputText.trim()) {
      const newMessages = [
        ...chat,
        {
          role: "user",
          content: inputText.trim(),
        },
        {
          role: "assistant",
          content:
            RANDOM_MESSAGES[Math.floor(Math.random() * RANDOM_MESSAGES.length)],
        },
      ] as { role: string; content: string }[];
      setChat(newMessages);
      setVisibleMessages(newMessages.length);
      setInputText("");
      setCurrentMessageComplete(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSendMessage();
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisibleMessages(1);
    }, INITIAL_DELAY);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (currentMessageComplete && visibleMessages < chat.length) {
      const timer = setTimeout(() => {
        setVisibleMessages((prev) => prev + 1);
        setCurrentMessageComplete(false);
      }, MESSAGE_DELAY);

      return () => clearTimeout(timer);
    }
  }, [currentMessageComplete, visibleMessages, chat.length]);

  useEffect(() => {
    if (chatContainerRef) {
      chatContainerRef.scrollTo({
        top: chatContainerRef.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [chatContainerRef]);

  return (
    <motion.div className="relative mx-auto mt-2 h-full max-h-70 min-h-40 w-[85%] p-4">
      <div className="-bottom-4 absolute inset-x-0 mx-auto flex w-[85%] items-center justify-between rounded-lg border border-gray-300 bg-white shadow-[0px_2px_12px_0px_rgba(0,0,0,0.08)] dark:border-neutral-700 dark:bg-neutral-800">
        <input
          className="flex-1 border-none px-4 py-4 text-xs placeholder-neutral-600 focus:outline-none"
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Submit feedback..."
          type="text"
          value={inputText}
        />
        <div className="mr-4 flex items-center gap-2">
          <HugeiconsIcon
            color="currentColor"
            icon={Attachment01Icon}
            size={16}
            strokeWidth={1.5}
          />
          <button
            className="cursor-pointer"
            onClick={handleSendMessage}
            type="button"
          >
            <HugeiconsIcon
              color="currentColor"
              icon={Rocket01Icon}
              size={16}
              strokeWidth={1.5}
            />
          </button>
        </div>
      </div>
      <div
        className="mask-bg-gradient-to-b mask-t-from-70% mask-b-from-70% flex max-h-[calc(100%-1rem)] flex-col gap-4 overflow-y-auto from-white to-transparent pt-4 pb-16 dark:from-neutral-900 dark:to-transparent"
        ref={setChatContainerRef}
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {chat.slice(0, visibleMessages).map((message, index) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            key={index}
            transition={{ duration: 0.3 }}
            viewport={{ once: true }}
            whileInView={{ opacity: 1, y: 0 }}
          >
            {message.role === "user" ? (
              <UserMessage
                content={message.content}
                isActive={index === visibleMessages - 1}
                onComplete={() => setCurrentMessageComplete(true)}
              />
            ) : (
              <AssistantMessage
                content={message.content}
                isActive={index === visibleMessages - 1}
                onComplete={() => setCurrentMessageComplete(true)}
              />
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

const UserMessage = ({
  content,
  isActive,
  onComplete,
}: {
  content: string;
  isActive: boolean;
  onComplete: () => void;
}) => {
  const { displayText, isComplete } = useTypewriter(
    isActive ? content : content,
    TYPING_SPEED
  );

  useEffect(() => {
    if (isComplete && isActive) {
      onComplete();
    }
  }, [isComplete, isActive, onComplete]);

  return (
    <div className="flex justify-end gap-3">
      <div className="flex max-w-xs flex-col gap-1">
        <div className="rounded-2xl rounded-br-md bg-blue-500 px-4 py-2 text-sm text-white">
          {isActive ? displayText : content}
          {isActive && !isComplete && <span className="animate-pulse">|</span>}
        </div>
      </div>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-blue-600 font-medium text-white text-xs">
        <Image
          alt="user"
          className="rounded-full"
          height={32}
          src="/avatar.webp"
          width={32}
        />
      </div>
    </div>
  );
};

const AssistantMessage = ({
  content,
  isActive,
  onComplete,
}: {
  content: string;
  isActive: boolean;
  onComplete: () => void;
}) => {
  const { displayText, isComplete } = useTypewriter(
    isActive ? content : content,
    TYPING_SPEED
  );

  useEffect(() => {
    if (isComplete && isActive) {
      onComplete();
    }
  }, [isComplete, isActive, onComplete]);

  return (
    <div className="flex gap-3 px-1">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white font-medium text-white text-xs shadow-aceternity dark:bg-neutral-900">
        <LogoSVG className="size-4 text-black dark:text-white" />
      </div>
      <div className="flex max-w-xs flex-col gap-1">
        <div className="rounded-2xl rounded-bl-md bg-gray-100 px-4 py-2 text-charcoal-700 text-sm">
          {isActive ? displayText : content}
          {isActive && !isComplete && <span className="animate-pulse">|</span>}
        </div>
      </div>
    </div>
  );
};

export const NativeToolsIntegrationSkeleton = () => (
  <>
    <div className="relative mx-auto my-24 h-full w-full scale-[2] sm:scale-[1.5] md:scale-[1.2] lg:hidden">
      <Image
        alt="Native Tools Integration"
        className="dark:invert dark:filter"
        height={1200}
        src="/illustrations/native-tools-integration.svg"
        width={1200}
      />
    </div>
    <motion.div className="relative mx-auto my-8 hidden h-full max-h-60 min-h-48 max-w-2xl items-center justify-center lg:flex">
      <motion.div
        animate={{ opacity: 1, y: 0 }}
        className="w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm dark:border-neutral-700 dark:bg-neutral-900"
        initial={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5 }}
      >
        <div className="space-y-0 divide-y divide-gray-200 dark:divide-neutral-700">
          {[
            { title: "Dark mode support", votes: 42, status: "Planned" },
            {
              title: "Export feedback to CSV",
              votes: 28,
              status: "In Progress",
            },
            { title: "Push notifications", votes: 15, status: "Under Review" },
          ].map((item, i) => (
            <motion.div
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-3 px-4 py-3"
              initial={{ opacity: 0, x: -10 }}
              key={item.title}
              transition={{ delay: 0.2 + i * 0.1 }}
            >
              <div className="flex shrink-0 flex-col items-center gap-0.5 rounded border border-gray-200 bg-gray-50 px-2 py-1 dark:border-neutral-700 dark:bg-neutral-800">
                <div className="text-gray-400 text-xs">▲</div>
                <div className="font-semibold text-xs">{item.votes}</div>
              </div>

              <div className="min-w-0 flex-1">
                <div className="font-medium text-sm">{item.title}</div>
                <div className="text-gray-500 text-xs dark:text-neutral-500">
                  2h ago
                </div>
              </div>

              <div className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-blue-600 text-xs dark:bg-blue-950 dark:text-blue-400">
                {item.status}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  </>
);
const _VerticalLine = (
  props: React.SVGProps<SVGSVGElement> & { stopColor?: string }
) => (
  <svg
    className="shrink-0"
    fill="none"
    height="81"
    viewBox="0 0 1 81"
    width="1"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <line
      stroke="var(--color-line)"
      transform="matrix(0 -1 -1 0 0 80.5)"
      x2="80"
      y1="-0.5"
      y2="-0.5"
    />
    <line
      stroke="url(#vertical-line-gradient)"
      transform="matrix(0 -1 -1 0 0 80.5)"
      x2="80"
      y1="-0.5"
      y2="-0.5"
    />
    <defs>
      <motion.linearGradient
        animate={{
          x1: 0,
          x2: 2,
          y1: "80%",
          y2: "100%",
        }}
        gradientUnits="userSpaceOnUse"
        id="vertical-line-gradient"
        initial={{
          x1: 0,
          x2: 2,
          y1: "0%",
          y2: "0%",
        }}
        transition={{
          duration: 4,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "loop",
          ease: "easeInOut",
          repeatDelay: 1,
        }}
      >
        <stop stopColor="var(--color-line)" />
        <stop offset="0.5" stopColor="#F17463" />
        <stop offset="1" stopColor="var(--color-line)" />
      </motion.linearGradient>
    </defs>
  </svg>
);

const _RightSideSVG = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    fill="none"
    height="2"
    viewBox="0 0 314 2"
    width="314"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <line
      stroke="var(--color-line)"
      strokeLinecap="round"
      x1="0.5"
      x2="313.5"
      y1="1"
      y2="1"
    />
    <line
      stroke="url(#horizontal-line-gradient)"
      strokeLinecap="round"
      x1="0.5"
      x2="313.5"
      y1="1"
      y2="1"
    />
    <defs>
      <motion.linearGradient
        animate={{
          y1: 0,
          y2: 1,
          x1: "110%",
          x2: "120%",
        }}
        gradientUnits="userSpaceOnUse"
        id="horizontal-line-gradient"
        initial={{
          y1: 0,
          y2: 1,
          x1: "-10%",
          x2: "0%",
        }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "loop",
          ease: "easeInOut",
          repeatDelay: 1,
        }}
      >
        <stop stopColor="var(--color-line)" />
        <stop offset="0.5" stopColor="var(--color-blue-500)" />
        <stop offset="1" stopColor="var(--color-line)" />
      </motion.linearGradient>
    </defs>
  </svg>
);

const _TopSVG = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    fill="none"
    height="33"
    viewBox="0 0 312 33"
    width="312"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <line
      stroke="var(--color-line)"
      strokeLinecap="round"
      x1="0.5"
      x2="311.5"
      y1="1"
      y2="1"
    />
    <line
      stroke="var(--color-line)"
      strokeLinecap="round"
      x1="311.5"
      x2="311.5"
      y1="1"
      y2="32"
    />

    <line
      stroke="url(#line-one-gradient)"
      strokeLinecap="round"
      x1="0.5"
      x2="311.5"
      y1="1"
      y2="1"
    />
    <defs>
      <motion.linearGradient
        animate={{
          x1: "105%",
          x2: "120%",
          y1: 1,
          y2: 0,
        }}
        gradientUnits="userSpaceOnUse"
        id="line-one-gradient"
        initial={{
          x1: "-20%",
          x2: "0%",
          y1: 1,
          y2: 0,
        }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "loop",
          ease: "easeInOut",
          repeatDelay: 1,
        }}
      >
        <stop stopColor="var(--color-line)" />
        <stop offset="0.33" stopColor="#F17463" />
        <stop offset="0.66" stopColor="#F17463" />
        <stop offset="1" stopColor="var(--color-line)" />
      </motion.linearGradient>
    </defs>
  </svg>
);

export const MiddleSVG = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    fill="none"
    height="2"
    viewBox="0 0 323 2"
    width="323"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <line
      stroke="var(--color-line)"
      strokeLinecap="round"
      x1="0.5"
      x2="322.5"
      y1="1"
      y2="1"
    />
    <line
      stroke="url(#line-two-gradient)"
      strokeLinecap="round"
      x1="0.5"
      x2="322.5"
      y1="1"
      y2="1"
    />
    <defs>
      <motion.linearGradient
        animate={{
          x1: "105%",
          x2: "120%",
          y1: 1,
          y2: 0,
        }}
        gradientUnits="userSpaceOnUse"
        id="line-two-gradient"
        initial={{
          x1: "-20%",
          x2: "0%",
          y1: 1,
          y2: 0,
        }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "loop",
          ease: "easeInOut",
          repeatDelay: 1,
        }}
      >
        <stop stopColor="var(--color-line)" />
        <stop offset="0.33" stopColor="var(--color-blue-500)" />
        <stop offset="0.66" stopColor="var(--color-blue-500)" />
        <stop offset="1" stopColor="var(--color-line)" />
      </motion.linearGradient>
    </defs>
  </svg>
);

export const BottomSVG = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    fill="none"
    height="32"
    viewBox="0 0 326 32"
    width="326"
    xmlns="http://www.w3.org/2000/svg"
    {...props}
  >
    <line stroke="var(--color-line)" x2="325" y1="31" y2="31" />

    <line
      stroke="var(--color-line)"
      strokeLinecap="round"
      x1="325.5"
      x2="325.5"
      y1="31"
      y2="1"
    />
    <line stroke="url(#line-three-gradient)" x2="325" y1="31" y2="31" />

    <defs>
      <motion.linearGradient
        animate={{
          x1: "105%",
          x2: "120%",
        }}
        gradientUnits="userSpaceOnUse"
        id="line-three-gradient"
        initial={{
          x1: "-20%",
          x2: "0%",
          y1: 1,
          y2: 0,
        }}
        transition={{
          duration: 2,
          repeat: Number.POSITIVE_INFINITY,
          repeatType: "loop",
          ease: "easeInOut",
          repeatDelay: 1,
        }}
      >
        <stop stopColor="var(--color-line)" />
        <stop offset="0.33" stopColor="var(--color-yellow-500)" />
        <stop offset="0.66" stopColor="var(--color-yellow-500)" />
        <stop offset="1" stopColor="var(--color-line)" />
      </motion.linearGradient>
    </defs>
  </svg>
);

const _TextIconBlock = ({
  icon,
  text,
  children,
}: {
  icon: React.ReactNode;
  text: string;
  children?: React.ReactNode;
}) => (
  <div className="relative flex items-center gap-2">
    {icon}
    <span className="font-medium text-charcoal-700 text-sm dark:text-neutral-200">
      {text}
    </span>
    {children}
  </div>
);
