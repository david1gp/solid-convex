import { classesButtonClickAnimation } from "#ui/interactive/button/classesButtonClickAnimation.js"
import { classesButtonDisabled } from "#ui/interactive/button/classesButtonDisabled.js"
import { classArr } from "#ui/utils/classArr.js"
import { cn } from "cn"

export type ButtonVariant = keyof typeof buttonVariant
export const buttonVariant = {
  none: "none",
  // transparent bg
  outline: "outline",
  ghost: "ghost",
  link: "link",
  // filled black/white/gray
  filled: "filled",
  subtle: "subtle",
  contrast: "contrast",
  // filled colors
  filledYellow: "filledYellow",
  filledAmber: "filledAmber",
  filledOrange: "filledOrange",
  filledRed: "filledRed",
  filledGreen: "filledGreen",
  filledSky: "filledSky",
  filledBlue: "filledBlue",
  filledIndigo: "filledIndigo",
  // filled gradient colors
  filledGreenGradient: "filledGreenGradient",
  filledYellowGradient: "filledYellowGradient",
  filledAmberGradient: "filledAmberGradient",
  filledOrangeGradient: "filledOrangeGradient",
  filledRedGradient: "filledRedGradient",
  filledSkyGradient: "filledSkyGradient",
  filledBlueGradient: "filledBlueGradient",
  filledBlueGreenGradient: "filledBlueGreenGradient",
  filledIndigoGradient: "filledIndigoGradient",
  // outlined colors
  outlineRed: "outlineRed",
} as const

export type ButtonCvaProps = {
  variant?: ButtonVariant
}

const baseClasses = classArr(
  "inline-flex", // layout
  "py-2 px-3", // sizing (single uniform size)
  "font-medium", // text
  "items-center justify-center", // layout children
  "rounded-md ring-offset-background", // rounded, rings
  "focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", // focus
  "transition-colors", // animation
  "group",
  "cursor-pointer",
)

const variantClasses = {
  //
  // transparent bg
  //
  none: "",
  outline: classArr(
    "bg-transparent", // bg
    "text-foreground", // text
    "hover:bg-hover", // bg hover
    "border border-border", // border
  ),
  ghost: classArr(
    "text-foreground", // text
    "bg-transparent", // bg
    "data-[state=open]:bg-transparent", // bg data
    "hover:bg-hover", // bg hover
  ),
  link: classArr(
    "text-foreground", // text
    "underline-offset-4 hover:underline ", // underline
    "bg-transparent", // bg
    "hover:bg-transparent", // bg hover
  ),
  //
  // filled grayscale
  //
  filled: classArr(
    "dark:text-slate-100", // text
    "bg-white dark:bg-black", // bg
    "hover:bg-slate-50 dark:hover:bg-slate-900", // bg hover
  ),
  subtle: classArr(
    "text-slate-900 dark:text-slate-100", // text
    "bg-slate-100 dark:bg-slate-700", // bg
    "hover:bg-slate-200 dark:hover:bg-slate-600", // bg hover
  ),
  contrast: classArr(
    "text-white dark:text-slate-900 dark:hover:text-slate-900", // text
    "bg-slate-900 dark:bg-slate-50", // bg
    "hover:bg-slate-700 dark:hover:bg-slate-300", // bg hover
  ),
  //
  // filled colors
  //
  filledYellow: classArr(
    "text-white", // text
    "bg-yellow-500 dark:bg-yellow-800 ", // bg
    "hover:bg-yellow-700 dark:hover:bg-yellow-600", // bg hover
    "focus:ring-yellow-400 dark:focus:ring-yellow-400", // focus
  ),
  filledAmber: classArr(
    "text-white", // text
    "bg-amber-500 dark:bg-amber-800 ", // bg
    "hover:bg-amber-700 dark:hover:bg-amber-600", // bg hover
    "focus:ring-amber-400 dark:focus:ring-amber-400", // focus
  ),
  filledOrange: classArr(
    "text-white", // text
    "bg-orange-500 dark:bg-orange-800 ", // bg
    "hover:bg-orange-700 dark:hover:bg-orange-600", // bg hover
    "focus:ring-orange-400 dark:focus:ring-orange-400", // focus
  ),
  filledRed: classArr(
    "text-white", // text
    "bg-red-500 dark:bg-red-700", // bg
    "hover:bg-red-600 dark:hover:bg-red-600", // bg hover
    "focus:ring-red-400 dark:focus:ring-red-400", // focus
  ),
  filledGreen: classArr(
    "text-white", // text
    "bg-green-500 hover:bg-green-700 dark:hover:bg-green-700", // bg
    "focus:ring-green-400 dark:focus:ring-green-400", // focus
  ),
  filledSky: classArr(
    "text-white", // text
    "bg-sky-500 hover:bg-sky-700 dark:hover:bg-sky-700", // bg
    "focus:ring-sky-400 dark:focus:ring-sky-400", // focus
  ),
  filledIndigo: classArr(
    "text-primary-foreground", // text
    "bg-primary", // bg (house accent, theme-adaptive)
    "hover:bg-brand-strong", // bg hover
    "focus:ring-ring", // focus
  ),
  filledBlue: classArr(
    "text-white", // text
    "bg-blue-500 dark:bg-blue-800 ", // bg
    "hover:bg-blue-700 dark:hover:bg-blue-600", // bg hover
    "focus:ring-blue-400 dark:focus:ring-blue-400", // focus
  ),
  //
  // filled gradient colors
  // fancy CTA gradients: two-tone fill, colored shadow, hover deepen
  //
  filledGreenGradient: classArr(
    "text-white", // text
    "bg-gradient-to-r from-green-500 to-emerald-600", // gradient bg
    "hover:from-green-600 hover:to-emerald-700", // bg hover
    "shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 transition-all", // shadow
    "focus:ring-emerald-400 dark:focus:ring-emerald-400", // focus
  ),
  filledYellowGradient: classArr(
    "text-white", // text
    "bg-gradient-to-r from-yellow-400 to-yellow-700", // gradient bg (pure yellow)
    "hover:from-yellow-500 hover:to-yellow-800", // bg hover
    "shadow-lg shadow-yellow-500/25 hover:shadow-yellow-500/40 transition-all", // shadow
    "focus:ring-yellow-400 dark:focus:ring-yellow-400", // focus
  ),
  filledAmberGradient: classArr(
    "text-white", // text
    "bg-gradient-to-r from-amber-400 to-amber-700", // gradient bg (pure amber)
    "hover:from-amber-500 hover:to-amber-800", // bg hover
    "shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 transition-all", // shadow
    "focus:ring-amber-400 dark:focus:ring-amber-400", // focus
  ),
  filledOrangeGradient: classArr(
    "text-white", // text
    "bg-gradient-to-r from-orange-400 to-orange-700", // gradient bg (pure orange)
    "hover:from-orange-500 hover:to-orange-800", // bg hover
    "shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all", // shadow
    "focus:ring-orange-400 dark:focus:ring-orange-400", // focus
  ),
  filledRedGradient: classArr(
    "text-white", // text
    "bg-gradient-to-r from-red-400 to-red-700", // gradient bg (pure red)
    "hover:from-red-500 hover:to-red-800", // bg hover
    "shadow-lg shadow-red-500/25 hover:shadow-red-500/40 transition-all", // shadow
    "focus:ring-red-400 dark:focus:ring-red-400", // focus
  ),
  filledSkyGradient: classArr(
    "text-white", // text
    "bg-gradient-to-r from-sky-400 to-sky-700", // gradient bg (pure sky)
    "hover:from-sky-500 hover:to-sky-800", // bg hover
    "shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 transition-all", // shadow
    "focus:ring-sky-400 dark:focus:ring-sky-400", // focus
  ),
  filledBlueGradient: classArr(
    "text-white", // text
    "bg-gradient-to-r from-blue-400 to-blue-700", // gradient bg (pure blue)
    "hover:from-blue-500 hover:to-blue-800", // bg hover
    "shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all", // shadow
    "focus:ring-blue-400 dark:focus:ring-blue-400", // focus
  ),
  filledBlueGreenGradient: classArr(
    "text-white", // text
    "bg-gradient-to-r from-blue-600 to-emerald-500", // gradient bg
    "hover:from-blue-700 hover:to-emerald-600", // bg hover
    "shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all", // shadow
    "focus:ring-blue-400 dark:focus:ring-blue-400", // focus
  ),
  filledIndigoGradient: classArr(
    "text-white", // text
    "bg-gradient-to-r from-indigo-400 to-indigo-700", // gradient bg (pure indigo)
    "hover:from-indigo-500 hover:to-indigo-800", // bg hover
    "shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 transition-all", // shadow
    "focus:ring-indigo-400 dark:focus:ring-indigo-400", // focus
  ),
  //
  // outline toast colors
  //
  outlineRed: classArr(
    "text-red-500 dark:text-red-500", // text
    "border border-red-200 dark:border-red-700", // border
    "bg-transparent", // bg
    "hover:bg-red-100 dark:hover:bg-red-950", // bg hover
    "focus:ring-red-400 dark:focus:ring-red-400", // focus
  ),
} as const satisfies Record<ButtonVariant, string>

export function buttonCva2(
  variant: ButtonVariant = buttonVariant.ghost,
  ...customClasses: import("@solidjs/web").JSX.ClassValue[]
) {
  return cn(baseClasses, variantClasses[variant], customClasses)
}

export function buttonCvaIconOnly(
  variant: ButtonVariant | undefined,
  isLoading: boolean | undefined,
  isDisabled: boolean | undefined,
  ...customClasses: import("@solidjs/web").JSX.ClassValue[]
) {
  const classes = buttonCva2(
    variant ?? buttonVariant.ghost,
    classesButtonClickAnimation,
    "rounded-full p-2.5",
    (isDisabled || isLoading) && classesButtonDisabled,
    ...customClasses,
  )
  return classes
}
