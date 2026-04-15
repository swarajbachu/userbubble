"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Tick01Icon } from "@hugeicons-pro/core-bulk-rounded";
import { cn } from "@userbubble/ui";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@userbubble/ui/popover";
import { tagConfig } from "~/components/changelog/config";

type ChangelogTagSelectorProps = {
  value: string[];
  onChange: (value: string[]) => void;
};

export function ChangelogTagSelector({
  value,
  onChange,
}: ChangelogTagSelectorProps) {
  const toggle = (key: string) => {
    if (value.includes(key)) {
      onChange(value.filter((t) => t !== key));
    } else {
      onChange([...value, key]);
    }
  };

  const selectedLabels = value
    .map((v) => tagConfig[v as keyof typeof tagConfig]?.label)
    .filter(Boolean);

  return (
    <Popover>
      <PopoverTrigger
        render={(props) => (
          <button
            {...props}
            className="inline-flex items-center gap-1.5 rounded-md border border-dashed px-2.5 py-1 text-muted-foreground text-xs transition-colors hover:border-border hover:text-foreground"
            type="button"
          >
            {selectedLabels.length > 0 ? (
              <span className="text-foreground">
                {selectedLabels.join(", ")}
              </span>
            ) : (
              <>
                <HugeiconsIcon icon={Add01Icon} size={12} />
                Add categories
              </>
            )}
          </button>
        )}
      />
      <PopoverContent
        align="start"
        className="w-[160px] [&_[data-slot=popover-viewport]]:px-2 [&_[data-slot=popover-viewport]]:py-2"
      >
        {Object.entries(tagConfig).map(([key, config]) => {
          const isSelected = value.includes(key);
          return (
            <button
              className={cn(
                "flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent"
              )}
              key={key}
              onClick={() => toggle(key)}
              type="button"
            >
              <span>{config.label}</span>
              {isSelected && (
                <HugeiconsIcon
                  className="text-primary"
                  icon={Tick01Icon}
                  size={14}
                />
              )}
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
}
