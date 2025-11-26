import { HugeiconsIcon } from "@hugeicons/react";
import type { ComponentProps } from "react";

type IconProps = ComponentProps<typeof HugeiconsIcon>;

export function Icon({
  size = 20,
  color = "currentColor",
  strokeWidth = 2,
  ...rest
}: IconProps) {
  return (
    <HugeiconsIcon
      color={color}
      size={size}
      strokeWidth={strokeWidth}
      {...rest}
    />
  );
}
