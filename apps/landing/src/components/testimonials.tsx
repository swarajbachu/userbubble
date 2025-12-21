/** biome-ignore-all lint/performance/noImgElement: using img for testimonial avatars with motion animations */
"use client";
import { AnimatePresence, motion } from "motion/react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { testimonials } from "@/constants/testimonials";
import { cn } from "@/lib/utils";
import { Dot } from "./common/dots";
import { Container } from "./container";
import { DivideX } from "./divide";
import { PixelatedCanvas } from "./pixelated-canvas";

export const Testimonials = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const selectedTestimonial = testimonials[currentIndex];

  const totalTestimonials = testimonials.length;

  // biome-ignore lint/correctness/useExhaustiveDependencies: interval depends on currentIndex for rotation control
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % totalTestimonials);
    }, 10_000);

    return () => clearInterval(intervalId);
  }, [totalTestimonials, currentIndex]);

  if (!selectedTestimonial) {
    return null;
  }

  return (
    <>
      <Container className="border-divide border-x">
        <h2 className="pt-20 pb-10 text-center font-mono text-neutral-500 text-sm uppercase tracking-tight dark:text-neutral-400">
          Trusted by Fast Growing Startups
        </h2>
      </Container>
      <DivideX />
      <Container className="relative border-divide border-x">
        <Dot left top />
        <Dot right top />
        <Dot bottom left />
        <Dot bottom right />

        <AnimatePresence initial={false} mode="wait">
          <motion.div
            animate={{
              opacity: 1,
              scale: 1,
            }}
            className="grid grid-cols-1 items-stretch divide-x divide-divide bg-gray-100 md:h-[28rem] md:grid-cols-4 dark:bg-neutral-800"
            exit={{
              opacity: 0,
              scale: 0.98,
            }}
            initial={{
              opacity: 0,
              scale: 0.98,
            }}
            key={selectedTestimonial.src}
            transition={{
              duration: 0.2,
              ease: "easeInOut",
            }}
          >
            <div className="col-span-4 flex flex-col gap-10 px-4 py-10 md:flex-row md:py-0 lg:col-span-3">
              <Image
                alt={selectedTestimonial.name}
                className="m-4 hidden aspect-square rounded-xl object-cover md:block"
                draggable={false}
                height={400}
                src={selectedTestimonial.avatar}
                width={400}
              />
              <div className="flex flex-col items-start justify-between gap-4 py-4 pr-8">
                <div>
                  <Image
                    alt={selectedTestimonial.company}
                    className={cn(
                      "object-contain dark:invert dark:filter",
                      selectedTestimonial.logoClassName
                    )}
                    draggable={false}
                    height={200}
                    src={selectedTestimonial.src}
                    width={200}
                  />
                  <blockquote className="mt-6 text-charcoal-900 text-xl leading-relaxed dark:text-neutral-100">
                    &quot;{selectedTestimonial.quote}&quot;
                  </blockquote>
                </div>

                <div className="flex items-end justify-between gap-4">
                  <Image
                    alt={selectedTestimonial.name}
                    className="aspect-square w-10 rounded-xl object-cover md:hidden"
                    height={400}
                    src={selectedTestimonial.avatar}
                    width={400}
                  />
                  <div>
                    <p className="font-semibold text-charcoal-900 dark:text-neutral-100">
                      {selectedTestimonial.name}
                    </p>
                    <p className="text-gray-600 text-sm dark:text-neutral-400">
                      {selectedTestimonial.position},{" "}
                      {selectedTestimonial.company}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="hidden flex-col justify-end px-4 pb-4 lg:col-span-1 lg:flex">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <p className="font-semibold text-7xl text-charcoal-700 dark:text-neutral-100">
                    {selectedTestimonial.sideText}
                  </p>
                  <p className="text-gray-700 text-sm dark:text-neutral-400">
                    {selectedTestimonial.sideSubText}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
        <div className="grid grid-cols-2 border-divide border-t md:grid-cols-4">
          {testimonials.slice(0, 8).map((testimonial, index) => (
            <button
              className={cn(
                "group relative overflow-hidden border-divide",
                "border-r md:border-r-0",
                index % 2 === 0 ? "border-r" : "",
                index < 6 ? "border-b md:border-b-0" : "",
                "md:border-r-0",
                index % 4 !== 3 ? "md:border-r" : "",
                index < 4 ? "md:border-b" : ""
              )}
              key={testimonial.src + index}
              onClick={() => {
                setCurrentIndex(index);
              }}
              type="button"
            >
              {selectedTestimonial.src === testimonial.src && (
                <PixelatedCanvas
                  backgroundColor="var(--color-canvas-fill)"
                  className="absolute inset-0 scale-[1.01] opacity-20"
                  duration={2500}
                  fillColor="var(--color-canvas)"
                  isActive={true}
                  key={`${testimonial.src}indexcanvas`}
                  size={2.5}
                />
              )}
              <AnimatePresence initial={false} mode="wait">
                <motion.div
                  animate={{
                    y: 0,
                    opacity: 0.7,
                  }}
                  className="group flex min-h-32 items-center justify-center p-4 py-10 opacity-70 grayscale transition-all duration-500 hover:opacity-100"
                  exit={{
                    opacity: 0,
                  }}
                  initial={{
                    y: 80,
                    opacity: 0,
                  }}
                  key={testimonial.src + index}
                  transition={{
                    duration: 0.4,
                    ease: "easeInOut",
                  }}
                  whileHover={{
                    opacity: 1,
                  }}
                >
                  <motion.img
                    alt={testimonial.company}
                    className={cn(
                      "h-8 w-auto object-contain transition-all duration-500 dark:invert dark:filter",
                      testimonial.logoClassName
                    )}
                    draggable={false}
                    height={200}
                    src={testimonial.src}
                    width={200}
                  />
                </motion.div>
              </AnimatePresence>
            </button>
          ))}
        </div>
      </Container>
    </>
  );
};
