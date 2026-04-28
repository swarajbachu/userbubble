"use client";

import { motion } from "motion/react";
import { Container } from "./container";

const stats = [
  { value: "5 min", label: "Average time to PR" },
  { value: "0", label: "Tickets you write" },
  { value: "100%", label: "You approve every change" },
];

export const StatsBar = () => (
  <Container className="border-divide border-x">
    <div className="grid grid-cols-1 divide-y divide-divide border-divide border-y md:grid-cols-3 md:divide-x md:divide-y-0">
      {stats.map((stat, index) => (
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="px-6 py-10 text-center"
          initial={{ opacity: 0, y: 10 }}
          key={stat.label}
          transition={{ duration: 0.4, delay: index * 0.15 }}
        >
          <p className="font-bold text-4xl text-brand tracking-tight">
            {stat.value}
          </p>
          <p className="mt-2 text-gray-600 text-sm dark:text-neutral-300">
            {stat.label}
          </p>
        </motion.div>
      ))}
    </div>
  </Container>
);
