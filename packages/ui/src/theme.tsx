"use client";

import {
  Desk01Icon,
  MoonIcon,
  SunIcon,
} from "@hugeicons-pro/core-bulk-rounded";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Icon } from "./icon";

import { useTheme } from "./theme-provider";

export type { ResolvedTheme, ThemeMode } from "./theme-provider";
export { ThemeProvider, themeDetectorScript, useTheme } from "./theme-provider";

export function ThemeToggle() {
  const { setTheme, themeMode } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button size="icon" variant="outline">
            {themeMode === "light" && <Icon icon={SunIcon} size={16} />}
            {themeMode === "dark" && <Icon icon={MoonIcon} size={16} />}
            {themeMode === "auto" && <Icon icon={Desk01Icon} size={16} />}
            <span className="sr-only">Toggle theme</span>
          </Button>
        }
      />
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("auto")}>
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
