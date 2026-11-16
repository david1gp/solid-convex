import { cn } from "cn"
import type { TailwindBreakpoint } from "#ui/utils/tailwindBreakpoint.js"
import { tailwindBreakpoint } from "#ui/utils/tailwindBreakpoint.js"

function tableDesktopClassName(b: TailwindBreakpoint) {
  const tb = tailwindBreakpoint
  return cn(
    "hidden",
    b === tb.sm && "sm:table",
    b === tb.md && "md:table",
    b === tb.lg && "lg:table",
    b === tb.xl && "xl:table",
  )
}
function tableMobileClassName(b: TailwindBreakpoint) {
  const tb = tailwindBreakpoint
  return cn(
    "w-full",
    b === tb.sm && "sm:hidden",
    b === tb.md && "md:hidden",
    b === tb.lg && "lg:hidden",
    b === tb.xl && "xl:hidden",
  )
}
export const tableVisibilityClasses = {
  desktop: tableDesktopClassName,
  mobile: tableMobileClassName,
}
