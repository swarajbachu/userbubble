"use client";
import { HugeiconsIcon } from "@hugeicons/react";
import { GithubIcon } from "@hugeicons-pro/core-duotone-rounded";
import {
  AnimatePresence,
  motion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { CloseIcon, HamburgerIcon } from "@/icons/general";
import { AuthButton } from "./auth-button";
import { Container } from "./container";
import { Logo } from "./logo";
import { ModeToggle } from "./mode-toggle";

const GITHUB_URL = "https://github.com/swarajbachu/userbubble";

const GitHubButton = () => (
  <Link
    aria-label="View on GitHub"
    className="relative flex cursor-pointer items-center justify-center rounded-xl p-2 text-neutral-500 hover:shadow-input dark:text-neutral-500"
    href={GITHUB_URL}
    rel="noopener"
    target="_blank"
  >
    <HugeiconsIcon
      className="size-4 text-gray-600 dark:text-gray-300"
      color="currentColor"
      icon={GithubIcon}
      size={16}
    />
  </Link>
);

export const Navbar = () => (
  <Container as="nav" className="">
    <FloatingNav />
    <DesktopNav />
    <MobileNav />
  </Container>
);

const MobileNav = () => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative flex items-center justify-between p-2 md:hidden">
      <Logo />
      <div className="flex items-center gap-1">
        <GitHubButton />
        <ModeToggle />
        <button
          aria-label="Toggle menu"
          className="flex size-6 flex-col items-center justify-center rounded-md shadow-aceternity"
          onClick={() => setIsOpen(!isOpen)}
          type="button"
        >
          <HamburgerIcon className="size-4 shrink-0 text-gray-600" />
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[60] h-full w-full bg-white shadow-lg dark:bg-neutral-900"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="flex items-center justify-between p-4">
              <Logo />
              <button
                aria-label="Toggle menu"
                className="flex size-6 flex-col items-center justify-center rounded-md shadow-aceternity"
                onClick={() => setIsOpen(!isOpen)}
                type="button"
              >
                <CloseIcon className="size-4 shrink-0 text-gray-600" />
              </button>
            </div>
            <div className="mt-6 flex flex-col border-divide border-t">
              <div className="p-4">
                <AuthButton className="w-full" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const DesktopNav = () => (
  <div className="hidden items-center justify-between px-4 py-4 md:flex">
    <Logo />
    <div className="flex items-center gap-2">
      <GitHubButton />
      <ModeToggle />
      <AuthButton />
    </div>
  </div>
);

const FloatingNav = () => {
  const { scrollY } = useScroll();
  const springConfig = {
    stiffness: 300,
    damping: 30,
  };
  const y = useSpring(
    useTransform(scrollY, [100, 120], [-100, 10]),
    springConfig
  );
  return (
    <motion.div
      className="fixed inset-x-0 top-0 z-50 mx-auto hidden max-w-[calc(80rem-4rem)] items-center justify-between bg-white/80 px-6 py-2 shadow-aceternity backdrop-blur-sm md:flex xl:rounded-2xl dark:bg-neutral-900/80 dark:shadow-[0px_2px_0px_0px_var(--color-neutral-800),0px_-2px_0px_0px_var(--color-neutral-800)]"
      style={{ y }}
    >
      <Logo />
      <div className="flex items-center gap-2">
        <GitHubButton />
        <ModeToggle />
        <AuthButton />
      </div>
    </motion.div>
  );
};
