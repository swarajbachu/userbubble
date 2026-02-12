/** biome-ignore-all lint/nursery/noShadow: items param shadows outer items const intentionally */
"use client";
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

const items = [
  {
    title: "GitHub",
    href: "https://github.com/userbubble/userbubble",
  },
];

export const Navbar = () => (
  <Container as="nav" className="">
    <FloatingNav items={items} />
    <DesktopNav items={items} />
    <MobileNav items={items} />
  </Container>
);

const MobileNav = ({ items }: { items: { title: string; href: string }[] }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="relative flex items-center justify-between p-2 md:hidden">
      <Logo />
      <button
        aria-label="Toggle menu"
        className="flex size-6 flex-col items-center justify-center rounded-md shadow-aceternity"
        onClick={() => setIsOpen(!isOpen)}
        type="button"
      >
        <HamburgerIcon className="size-4 shrink-0 text-gray-600" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-[60] h-full w-full bg-white shadow-lg dark:bg-neutral-900"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="absolute right-4 bottom-4">
              <ModeToggle />
            </div>

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
            <div className="mt-6 flex flex-col divide-y divide-divide border-divide border-t">
              {items.map((item, index) => (
                <Link
                  className="px-4 py-2 font-medium text-gray-600 transition duration-200 hover:text-neutral-900 dark:text-gray-300 dark:hover:text-neutral-300"
                  href={item.href}
                  key={item.title}
                  onClick={() => setIsOpen(false)}
                >
                  <motion.div
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    initial={{ opacity: 0, y: 10 }}
                    key={item.title}
                    transition={{ duration: 0.2, delay: index * 0.1 }}
                  >
                    {item.title}
                  </motion.div>
                </Link>
              ))}
              <div className="mt-4 p-4">
                <AuthButton className="w-full" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const DesktopNav = ({
  items,
}: {
  items: { title: string; href: string }[];
}) => (
  <div className="hidden items-center justify-between px-4 py-4 md:flex">
    <Logo />
    <div className="flex items-center gap-10">
      {items.map((item) => (
        <Link
          className="font-medium text-gray-600 transition duration-200 hover:text-neutral-900 dark:text-gray-300 dark:hover:text-neutral-300"
          href={item.href}
          key={item.title}
        >
          {item.title}
        </Link>
      ))}
    </div>
    <div className="flex items-center gap-2">
      <ModeToggle />
      <AuthButton />
    </div>
  </div>
);

const FloatingNav = ({
  items,
}: {
  items: { title: string; href: string }[];
}) => {
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
      <div className="flex items-center gap-10">
        {items.map((item) => (
          <Link
            className="font-medium text-gray-600 transition duration-200 hover:text-neutral-900 dark:text-gray-300 dark:hover:text-neutral-300"
            href={item.href}
            key={item.title}
          >
            {item.title}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <ModeToggle />
        <AuthButton />
      </div>
    </motion.div>
  );
};
