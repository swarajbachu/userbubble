import { cx } from "class-variance-authority";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: Parameters<typeof cx>) => twMerge(cx(inputs));

// Re-export types from react-day-picker for calendar usage
export type { DateRange } from "react-day-picker";

// Export Tiptap editor
export * from "./tiptap-editor";
