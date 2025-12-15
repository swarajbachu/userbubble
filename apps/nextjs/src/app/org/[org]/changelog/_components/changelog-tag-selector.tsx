import { cn } from "@userbubble/ui";
import { Icon } from "@userbubble/ui/icon";
import { tagConfig } from "~/components/changelog/config";

type ChangelogTagSelectorProps = {
  value: string[];
  onChange: (value: string[]) => void;
};

export function ChangelogTagSelector({
  value,
  onChange,
}: ChangelogTagSelectorProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {Object.entries(tagConfig).map(([key, config]) => {
        const isSelected = value.includes(key);
        return (
          <button
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
              isSelected
                ? `${config.bg} border-primary`
                : "border-input hover:bg-accent"
            )}
            key={key}
            onClick={() => {
              if (isSelected) {
                onChange(value.filter((t) => t !== key));
              } else {
                onChange([...value, key]);
              }
            }}
            type="button"
          >
            <Icon className={config.color} icon={config.icon} size={16} />
            <span className={config.color}>{config.label}</span>
          </button>
        );
      })}
    </div>
  );
}
