"use client";
import { AnimatePresence, motion } from "motion/react";
import type React from "react";
import { useMemo, useState } from "react";
import useMeasure from "react-use-measure";
import { faqs } from "@/constants/faqs";
import { Badge } from "./badge";
import { Button } from "./button";
import { Container } from "./container";
import { DivideX } from "./divide";
import { SectionHeading } from "./seciton-heading";
import { SubHeading } from "./subheading";

const ChevronDownIcon = (
  props: React.SVGProps<SVGSVGElement> & { rotated?: boolean }
) => {
  const { className, ...rest } = props;
  return (
    <svg
      className={className}
      fill="none"
      height="16"
      viewBox="0 0 16 16"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <path
        d="M3.75 6.5L8 10.75L12.25 6.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
};

export const FAQs = () => {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set());

  const toggle = (index: number) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <Container className="flex flex-col items-center border-divide border-x pt-12">
      <Badge text="FAQs" />
      <SectionHeading className="mt-4">
        Frequently Asked Questions
      </SectionHeading>

      <SubHeading as="p" className="mx-auto mt-6 max-w-lg px-2">
        Find all your doubts and questions in one place. Still couldn't find
        what you're looking for?
      </SubHeading>
      <div className="mt-8 mb-12 flex w-full flex-col justify-center gap-4 px-4 sm:flex-row">
        <Button className="w-full sm:w-auto" variant="primary">
          Read Docs
        </Button>
        <Button
          as="a"
          className="w-full sm:w-auto"
          href="mailto:support@example.com"
          variant="secondary"
        >
          Contact Us
        </Button>
      </div>
      <DivideX />
      <div className="w-full divide-y divide-divide">
        {faqs.map((item, index) => (
          <AccordionItem
            answer={item.answer}
            index={index}
            isOpen={openItems.has(index)}
            key={item.question}
            onToggle={() => toggle(index)}
            question={item.question}
          />
        ))}
      </div>
    </Container>
  );
};

const AccordionItem = ({
  index,
  question,
  answer,
  isOpen,
  onToggle,
}: {
  index: number;
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) => {
  const [ref, { height }] = useMeasure();
  const targetHeight = useMemo(() => (isOpen ? height : 0), [isOpen, height]);

  return (
    <div className="group">
      <button
        aria-controls={`faq-panel-${index}`}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 px-8 py-6 text-left"
        onClick={onToggle}
        type="button"
      >
        <span className="font-medium text-base text-charcoal-700 dark:text-neutral-100">
          {question}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          className="inline-flex size-6 items-center justify-center rounded-md bg-white text-charcoal-700 shadow-aceternity dark:bg-neutral-950"
          initial={false}
          transition={{ duration: 0.25 }}
        >
          <ChevronDownIcon className="dark:text-neutral-100" />
        </motion.span>
      </button>

      <motion.div
        animate={{ height: targetHeight, opacity: isOpen ? 1 : 0 }}
        aria-hidden={!isOpen}
        className="overflow-hidden px-8"
        id={`faq-panel-${index}`}
        initial={false}
        onClick={onToggle}
        role="region"
        transition={{ height: { duration: 0.35 }, opacity: { duration: 0.2 } }}
      >
        <div className="pr-2 pb-5 pl-2 sm:pr-0 sm:pl-0" ref={ref}>
          <AnimatePresence mode="popLayout">
            {isOpen && (
              <motion.p
                animate={{ y: 0, opacity: 1 }}
                className="text-gray-600 dark:text-neutral-400"
                exit={{ y: -6, opacity: 0 }}
                initial={{ y: -6, opacity: 0 }}
                key="content"
                transition={{ duration: 0.25 }}
              >
                {answer}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
