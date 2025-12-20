/** biome-ignore-all lint/complexity/noForEach: <explanation> */
"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { pricingTable, TierName, tiers } from "@/constants/pricing";
import { cn } from "@/lib/utils";
import { Button } from "./button";
import { Container } from "./container";
import { SlidingNumber } from "./sliding-number";

export const PricingTable = () => {
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");

  const orderedTierNames: TierName[] = useMemo(
    () => [TierName.TIER_1, TierName.TIER_2, TierName.TIER_3],
    []
  );

  const titleToPrice: Record<string, { monthly: number; yearly: number }> =
    useMemo(() => {
      const map: Record<string, { monthly: number; yearly: number }> = {};
      tiers.forEach((t) => {
        map[t.title] = { monthly: t.monthly, yearly: t.yearly };
      });
      return map;
    }, []);

  return (
    <section>
      <Container className="border-divide border-x">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="">
              <tr className="divide-x divide-divide border-divide border-b">
                <th className="min-w-[220px] px-4 pt-12 pb-8 align-bottom font-medium text-gray-600 text-sm dark:text-neutral-200">
                  <div className="mb-2 font-normal text-gray-600 text-sm dark:text-neutral-200">
                    Select a preferred cycle
                  </div>
                  <div className="inline-flex rounded-md bg-gray-100 p-1 dark:bg-neutral-800">
                    {[
                      { label: "Monthly", value: "monthly" },
                      { label: "Yearly", value: "yearly" },
                    ].map((opt) => (
                      <button
                        aria-pressed={
                          cycle === (opt.value as "monthly" | "yearly")
                        }
                        className={cn(
                          "relative z-10 rounded-md px-3 py-1 text-gray-800 text-sm dark:text-white",
                          cycle === opt.value &&
                            "bg-white shadow-aceternity dark:bg-neutral-900 dark:text-white"
                        )}
                        key={opt.value}
                        onClick={() =>
                          setCycle(opt.value as "monthly" | "yearly")
                        }
                        type="button"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </th>
                {orderedTierNames.map((tierName) => (
                  <th
                    className="min-w-[220px] px-4 pt-12 pb-8 align-bottom"
                    key={`hdr-${tierName}`}
                  >
                    <div className="font-medium text-charcoal-700 text-lg dark:text-neutral-100">
                      {tierName}
                    </div>
                    <div className="flex items-center font-normal text-gray-600 text-sm dark:text-neutral-300">
                      $
                      <SlidingNumber
                        value={titleToPrice[tierName]?.[cycle] ?? 0}
                      />
                      /seat billed{" "}
                      {cycle === "monthly" ? "monthly" : "annually"}
                    </div>
                    <Button
                      as={Link}
                      className="mt-4 w-full"
                      href="/sign-up"
                      variant="secondary"
                    >
                      Start for free
                    </Button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="">
              {pricingTable.map((row, index) => (
                <tr
                  className={cn(
                    "divide-x divide-divide border-divide border-b",
                    index % 2 === 0 && "bg-gray-50 dark:bg-neutral-800"
                  )}
                  key={row.title}
                >
                  <td className="flex px-4 py-6 text-center text-charcoal-700 text-sm dark:text-neutral-100">
                    {row.title}
                  </td>
                  {orderedTierNames.map((tierName) => {
                    const tierVal = row.tiers.find(
                      (t) => t.title === tierName
                    )?.value;
                    return (
                      <td
                        className="mx-auto px-4 py-6 text-center text-charcoal-700 text-sm dark:text-neutral-100"
                        key={`${row.title}-${tierName}`}
                      >
                        {tierVal}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Container>
    </section>
  );
};

export default PricingTable;
