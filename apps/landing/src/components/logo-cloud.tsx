/** biome-ignore-all lint/correctness/useImageSize: logo sizes are responsive and controlled by CSS */
/** biome-ignore-all lint/performance/noImgElement: using img for animated logo cloud with motion */
"use client";

import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { logos } from "@/constants/logos";
import { cn } from "@/lib/utils";
import { Container } from "./container";

export const LogoCloud = () => {
  // Track which logos are currently displayed (indices)
  const [displayedIndices, setDisplayedIndices] = useState<number[]>(() =>
    Array.from({ length: 8 }, (_, i) => i)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const notDisplayedIndices = logos
        .map((_, index) => index)
        .filter((index) => !displayedIndices.includes(index));

      if (notDisplayedIndices.length > 0) {
        const randomDisplayedIndex = Math.floor(
          Math.random() * displayedIndices.length
        );
        const positionToReplace = randomDisplayedIndex;

        const randomNotDisplayedIndex = Math.floor(
          Math.random() * notDisplayedIndices.length
        );
        const newLogoIndex = notDisplayedIndices[randomNotDisplayedIndex];

        setDisplayedIndices((prev) => {
          const newIndices = [...prev];
          let newIndex = newIndices[positionToReplace];
          if (newIndex) {
            newIndex = newLogoIndex;
          }
          return newIndices;
        });
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [displayedIndices]);

  return (
    <Container className="border-divide border-x">
      <h2 className="py-8 text-center font-mono text-neutral-500 text-sm uppercase tracking-tight dark:text-gray-300">
        Trusted by Fast Growing Startups
      </h2>
      <div className="grid grid-cols-2 border-divide border-t md:grid-cols-4">
        {displayedIndices.map((logoIndex, position) => {
          const logo = logos[logoIndex];

          if (!logo) {
            return null;
          }

          return (
            <div
              className={cn(
                "group relative overflow-hidden border-divide",
                "border-r md:border-r-0",
                position % 2 === 0 ? "border-r" : "",
                position < 6 ? "border-b md:border-b-0" : "",
                "md:border-r-0",
                position % 4 !== 3 ? "md:border-r" : "",
                position < 4 ? "md:border-b" : ""
              )}
              key={position}
            >
              <div className="absolute inset-x-0 bottom-0 h-full translate-y-full animate-move-left-to-right bg-brand/5 transition-all duration-200 group-hover:translate-y-0" />
              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  animate={{
                    y: 0,
                    opacity: 1,
                  }}
                  className="group flex min-h-32 items-center justify-center p-4 py-10 grayscale"
                  exit={{
                    opacity: 0,
                    y: -100,
                  }}
                  initial={{
                    y: 100,
                    opacity: 0,
                  }}
                  key={logoIndex}
                  transition={{
                    duration: 0.2,
                    ease: "easeInOut",
                  }}
                  whileHover={{
                    opacity: 1,
                  }}
                >
                  <motion.img
                    alt={logo.title}
                    className={cn(
                      "h-8 w-auto object-contain transition-all duration-500 dark:invert dark:filter",
                      logo.className
                    )}
                    src={logo.src}
                  />
                </motion.div>
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </Container>
  );
};
