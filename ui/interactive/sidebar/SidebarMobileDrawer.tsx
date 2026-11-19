import { omit } from "solid-js"
import { CorvuDialog, type CorvuDialogProps } from "#ui/interactive/dialog/CorvuDialog.jsx"
import { cn } from "cn"
import type { SignalObject } from "#ui/utils/createSignalObject.js"

export interface SidebarMobileDrawerProps extends Omit<CorvuDialogProps, "open" | "onOpenChange"> {
  open: SignalObject<boolean>
}

/** Mobile sidebar rendered as a left-anchored dialog drawer (house anatomy). */
export function SidebarMobileDrawer(p: SidebarMobileDrawerProps) {
  const rest = omit(p, "open", "class", "innerClass")
  return (
    <CorvuDialog
      {...rest}
      open={p.open.get()}
      onOpenChange={(open) => p.open.set(open)}
      class={cn("hidden", p.class)}
      innerClass={cn(
        // left-anchored full-height drawer overrides the centered dialog card;
        // flex column so the sidebar content fills the height (footer at bottom)
        "left-0 top-0 translate-x-0 translate-y-0",
        "h-dvh max-h-none w-[220px] max-w-[85vw]",
        "flex flex-col",
        "rounded-none border-border shadow-none dark:border-border",
        "bg-surface dark:bg-surface",
        "p-0",
        p.innerClass,
      )}
    />
  )
}
