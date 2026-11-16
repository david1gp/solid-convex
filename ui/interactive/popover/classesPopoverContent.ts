import { cn } from "cn"

export const classesPopoverContent = [
  "z-50", // positioning
  "max-w-4xl",
  "px-3 py-3", // spacing
  "rounded-xl", // border
  "border border-slate-200 dark:border-slate-700", // soft border (never currentColor)
  "bg-white dark:bg-slate-900", // background
  "shadow-lg shadow-slate-900/10 dark:shadow-black/30", // shadow
  "data-open:animate-in data-open:fade-in-50% data-open:slide-in-from-top-1 data-closed:animate-out data-closed:fade-out-50% data-closed:slide-out-to-top-1", // animations
]

export function classesPopoverContentMerge(innerClass?: string) {
  return cn(classesPopoverContent, innerClass)
}
